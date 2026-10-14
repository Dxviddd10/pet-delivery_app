#!/usr/bin/env python3
"""
code_inspector.py - Herramienta de Mapeo Interno del Repositorio
================================================================
Explora de forma recursiva la estructura de carpetas del proyecto, ignorando
archivos irrelevantes (node_modules, .git, venv, builds, etc.), extrae contexto
técnico clave (componentes, hooks, rutas, modelos SQL, funciones, tipos) y genera
un mapa de referencia rápida para el agente y desarrolladores.

Uso:
    py tools/code_inspector.py
    py tools/code_inspector.py --format markdown --output project_map.md
    py tools/code_inspector.py --format json --output project_map.json
    py tools/code_inspector.py --save
"""

import os
import sys
import re
import json
import ast
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Set

# Directorios a excluir siempre de la exploración
IGNORED_DIRS: Set[str] = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "env",
    ".env",
    "__pycache__",
    ".expo",
    ".expo-shared",
    "dist",
    ".next",
    "build",
    "out",
    ".turbo",
    ".idea",
    ".vscode",
    "coverage",
    ".system_generated",
    "artifacts",
    ".dart_tool",
    "android",
    "ios",
}

# Archivos específicos o extensiones a ignorar
IGNORED_FILES: Set[str] = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
    ".DS_Store",
    "Thumbs.db",
    "next-env.d.ts",
}

IGNORED_EXTENSIONS: Set[str] = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".map", ".log", ".tmp", ".bak", ".swp",
    ".pyc", ".pyo", ".pyd",
    ".mp4", ".mov", ".avi", ".mp3", ".wav",
    ".pdf", ".zip", ".tar", ".gz"
}


def load_gitignore_patterns(root_path: Path) -> List[str]:
    """Carga los patrones simples de .gitignore si existen."""
    gitignore_path = root_path / ".gitignore"
    patterns = []
    if gitignore_path.exists():
        try:
            with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    clean = line.strip()
                    if clean and not clean.startswith("#"):
                        patterns.append(clean.rstrip("/"))
        except Exception:
            pass
    return patterns


class CodeInspector:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir.resolve()
        self.gitignore_patterns = load_gitignore_patterns(self.root_dir)
        self.files_data: List[Dict[str, Any]] = []
        self.stats = {
            "total_files": 0,
            "total_lines": 0,
            "by_extension": {},
            "by_category": {},
            "components_count": 0,
            "hooks_count": 0,
            "routes_count": 0,
            "sql_tables_count": 0,
        }

    def should_ignore_dir(self, dir_name: str, relative_path: Path) -> bool:
        """Determina si un directorio debe ser ignorado."""
        if dir_name in IGNORED_DIRS:
            return True
        for pattern in self.gitignore_patterns:
            if pattern == dir_name or pattern == str(relative_path).replace("\\", "/"):
                return True
        return False

    def should_ignore_file(self, file_name: str, relative_path: Path) -> bool:
        """Determina si un archivo debe ser ignorado."""
        if file_name in IGNORED_FILES:
            return True
        suffix = Path(file_name).suffix.lower()
        if suffix in IGNORED_EXTENSIONS:
            return True
        rel_str = str(relative_path).replace("\\", "/")
        for pattern in self.gitignore_patterns:
            if pattern == file_name or pattern == rel_str:
                return True
            if pattern.startswith("*") and file_name.endswith(pattern[1:]):
                return True
        return False

    def categorize_path(self, rel_path: Path) -> str:
        """Clasifica el archivo en una capa de la arquitectura del proyecto."""
        posix = rel_path.as_posix()
        if posix.startswith("app/"):
            return "Mobile App (Expo Router)"
        elif posix.startswith("src/components/"):
            return "Mobile Component"
        elif posix.startswith("src/hooks/"):
            return "Mobile Hook"
        elif posix.startswith("src/providers/"):
            return "Mobile Provider"
        elif posix.startswith("src/lib/"):
            return "Mobile Library/Service"
        elif posix.startswith("src/"):
            return "Mobile Core"
        elif posix.startswith("panel/src/app/"):
            return "Web Admin Panel (Next.js Page/Route)"
        elif posix.startswith("panel/src/components/"):
            return "Web Admin Component"
        elif posix.startswith("panel/src/lib/"):
            return "Web Admin Library/Service"
        elif posix.startswith("panel/"):
            return "Web Admin Core/Config"
        elif posix.startswith("supabase/"):
            return "Database & Backend (Supabase)"
        elif posix.startswith("tools/"):
            return "Developer Tools"
        else:
            return "Project Root Config/Doc"

    def extract_typescript_javascript_context(self, content: str, rel_path: Path) -> Dict[str, Any]:
        """Extrae componentes, hooks, rutas, acciones y tipos de archivos TS/JS."""
        context = {
            "components": [],
            "hooks": [],
            "functions": [],
            "types_interfaces": [],
            "classes": [],
            "routes": [],
            "is_server_action": False,
            "exports": []
        }

        posix = rel_path.as_posix()

        # Detección de Server Actions en Next.js
        if "'use server'" in content or '"use server"' in content:
            context["is_server_action"] = True

        # Detección de Rutas
        # 1. Expo Router (en app/)
        if posix.startswith("app/"):
            route_name = "/" + posix[len("app/"):].replace(".tsx", "").replace(".ts", "").replace(".jsx", "").replace(".js", "")
            if route_name.endswith("/index"):
                route_name = route_name[:-6] or "/"
            context["routes"].append(f"Expo Route: {route_name}")

        # 2. Next.js App Router (en panel/src/app/)
        elif posix.startswith("panel/src/app/"):
            subpath = posix[len("panel/src/app/"):]
            if subpath.endswith("page.tsx") or subpath.endswith("page.ts"):
                route_name = "/" + subpath.replace("/page.tsx", "").replace("/page.ts", "").replace("page.tsx", "").replace("page.ts", "")
                context["routes"].append(f"Next.js Page: {route_name or '/'}")
            elif subpath.endswith("route.ts") or subpath.endswith("route.js"):
                route_name = "/" + subpath.replace("/route.ts", "").replace("/route.js", "")
                context["routes"].append(f"Next.js API Route: {route_name or '/'}")
            elif subpath.endswith("layout.tsx"):
                route_name = "/" + subpath.replace("/layout.tsx", "")
                context["routes"].append(f"Next.js Layout: {route_name or '/'}")

        # Extracción de Interfaces y Types
        interfaces = re.findall(r"(?:export\s+)?interface\s+([A-Za-z0-9_]+)", content)
        types = re.findall(r"(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=", content)
        context["types_interfaces"] = sorted(list(set(interfaces + types)))

        # Extracción de Clases
        classes = re.findall(r"(?:export\s+)?class\s+([A-Za-z0-9_]+)", content)
        context["classes"] = sorted(list(set(classes)))

        # Extracción de Hooks
        hooks = re.findall(r"(?:export\s+)?(?:function\s+(use[A-Z][A-Za-z0-9_]*)|const\s+(use[A-Z][A-Za-z0-9_]*)\s*=)", content)
        found_hooks = []
        for h1, h2 in hooks:
            name = h1 or h2
            if name:
                found_hooks.append(name)
        context["hooks"] = sorted(list(set(found_hooks)))

        # Extracción de Componentes React (Convención PascalCase exportados o definidos)
        component_candidates = re.findall(r"(?:export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)|export\s+function\s+([A-Z][A-Za-z0-9_]*)|const\s+([A-Z][A-Za-z0-9_]*)\s*:\s*(?:React\.)?(?:FC|FunctionComponent)|const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(?:memo\(|forwardRef\(|\([^)]*\)\s*=>))", content)
        found_components = []
        for c1, c2, c3, c4 in component_candidates:
            name = c1 or c2 or c3 or c4
            if name and name not in context["types_interfaces"]:
                found_components.append(name)

        # Si export default sin nombre explícito en pantalla/componente
        if re.search(r"export\s+default\s+(?:function\s*\(|\(\)\s*=>)", content):
            found_components.append(f"{rel_path.stem} (Default Export)")

        context["components"] = sorted(list(set(found_components)))

        # Funciones generales exportadas
        exp_funcs = re.findall(r"export\s+(?:async\s+)?function\s+([a-z][A-Za-z0-9_]*)", content)
        exp_const_funcs = re.findall(r"export\s+const\s+([a-z][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>", content)
        context["functions"] = sorted(list(set(exp_funcs + exp_const_funcs)))

        # Listado de exportaciones directas
        named_exports = re.findall(r"export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_]+)", content)
        context["exports"] = sorted(list(set(named_exports)))

        return context

    def extract_python_context(self, content: str) -> Dict[str, Any]:
        """Extrae clases y funciones de archivos Python usando AST."""
        context = {
            "classes": [],
            "functions": [],
            "async_functions": [],
            "docstring": ""
        }
        try:
            tree = ast.parse(content)
            context["docstring"] = ast.get_docstring(tree) or ""
            for node in ast.iter_child_nodes(tree):
                if isinstance(node, ast.ClassDef):
                    methods = [n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
                    context["classes"].append({"name": node.name, "methods": methods})
                elif isinstance(node, ast.FunctionDef):
                    context["functions"].append(node.name)
                elif isinstance(node, ast.AsyncFunctionDef):
                    context["async_functions"].append(node.name)
        except Exception:
            # Fallback regex si AST falla por incompatibilidad de sintaxis
            classes = re.findall(r"class\s+([A-Za-z0-9_]+)", content)
            funcs = re.findall(r"def\s+([A-Za-z0-9_]+)", content)
            context["classes"] = [{"name": c, "methods": []} for c in classes]
            context["functions"] = funcs

        return context

    def extract_sql_context(self, content: str) -> Dict[str, Any]:
        """Extrae tablas, funciones, vistas, políticas y triggers de SQL."""
        context = {
            "tables": [],
            "functions": [],
            "triggers": [],
            "policies": [],
            "views": []
        }

        # Tablas
        tables = re.findall(r"create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([A-Za-z0-9_]+)", content, re.IGNORECASE)
        context["tables"] = sorted(list(set(tables)))

        # Funciones
        funcs = re.findall(r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([A-Za-z0-9_]+)", content, re.IGNORECASE)
        context["functions"] = sorted(list(set(funcs)))

        # Vistas
        views = re.findall(r"create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?([A-Za-z0-9_]+)", content, re.IGNORECASE)
        context["views"] = sorted(list(set(views)))

        # Triggers
        triggers = re.findall(r"create\s+trigger\s+([A-Za-z0-9_]+)", content, re.IGNORECASE)
        context["triggers"] = sorted(list(set(triggers)))

        # Políticas RLS
        policies = re.findall(r"create\s+policy\s+[\"']?([^\"'\n]+)[\"']?\s+on\s+(?:public\.)?([A-Za-z0-9_]+)", content, re.IGNORECASE)
        context["policies"] = [f"{p[0]} ON {p[1]}" for p in policies]

        return context

    def extract_json_context(self, content: str, rel_path: Path) -> Dict[str, Any]:
        """Extrae configuración clave de archivos JSON."""
        context = {"summary": "", "scripts": [], "dependencies_count": 0}
        try:
            data = json.loads(content)
            if rel_path.name == "package.json":
                scripts = list(data.get("scripts", {}).keys())
                deps = len(data.get("dependencies", {}))
                dev_deps = len(data.get("devDependencies", {}))
                context["scripts"] = scripts
                context["dependencies_count"] = deps + dev_deps
                context["summary"] = f"npm pkg: {data.get('name', 'app')} v{data.get('version', '0.0.0')} ({deps} deps, {dev_deps} devDeps)"
            elif rel_path.name == "app.json":
                expo = data.get("expo", {})
                context["summary"] = f"Expo app: {expo.get('name')} (slug: {expo.get('slug')}, scheme: {expo.get('scheme')})"
        except Exception:
            pass
        return context

    def inspect_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Analiza un archivo individual y extrae su contexto."""
        rel_path = file_path.relative_to(self.root_dir)
        ext = file_path.suffix.lower()

        try:
            stat = file_path.stat()
            size_bytes = stat.st_size
        except Exception:
            return None

        # Lectura segura del contenido
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except Exception:
            return None

        lines = content.splitlines()
        line_count = len(lines)
        category = self.categorize_path(rel_path)

        # Contexto específico por lenguaje
        context: Dict[str, Any] = {}
        if ext in {".ts", ".tsx", ".js", ".jsx"}:
            context = self.extract_typescript_javascript_context(content, rel_path)
            self.stats["components_count"] += len(context.get("components", []))
            self.stats["hooks_count"] += len(context.get("hooks", []))
            self.stats["routes_count"] += len(context.get("routes", []))
        elif ext == ".py":
            context = self.extract_python_context(content)
        elif ext == ".sql":
            context = self.extract_sql_context(content)
            self.stats["sql_tables_count"] += len(context.get("tables", []))
        elif ext == ".json":
            context = self.extract_json_context(content, rel_path)
        elif ext == ".md":
            # Extraer títulos
            headings = [line.strip("# ").strip() for line in lines if line.startswith("# ") or line.startswith("## ")][:4]
            context = {"headings": headings}

        file_info = {
            "path": rel_path.as_posix(),
            "name": file_path.name,
            "extension": ext or "none",
            "size_bytes": size_bytes,
            "line_count": line_count,
            "category": category,
            "context": context
        }

        # Actualizar estadísticas globales
        self.stats["total_files"] += 1
        self.stats["total_lines"] += line_count
        self.stats["by_extension"][ext or "none"] = self.stats["by_extension"].get(ext or "none", 0) + 1
        self.stats["by_category"][category] = self.stats["by_category"].get(category, 0) + 1

        return file_info

    def scan(self) -> None:
        """Recorre recursivamente el proyecto filtrando e inspeccionando."""
        self.files_data.clear()
        self.stats = {
            "total_files": 0,
            "total_lines": 0,
            "by_extension": {},
            "by_category": {},
            "components_count": 0,
            "hooks_count": 0,
            "routes_count": 0,
            "sql_tables_count": 0,
        }

        for root, dirs, files in os.walk(self.root_dir):
            rel_root = Path(root).relative_to(self.root_dir)

            # Filtrar directorios in-place
            dirs[:] = [
                d for d in dirs
                if not self.should_ignore_dir(d, rel_root / d)
            ]

            for file in sorted(files):
                file_path = Path(root) / file
                rel_file = rel_root / file

                if self.should_ignore_file(file, rel_file):
                    continue

                info = self.inspect_file(file_path)
                if info:
                    self.files_data.append(info)

        # Ordenar archivos por ruta relativa
        self.files_data.sort(key=lambda x: x["path"])

    def generate_json(self) -> str:
        """Genera representación JSON de todo el mapa de código."""
        output = {
            "root_directory": str(self.root_dir),
            "statistics": self.stats,
            "files": self.files_data
        }
        return json.dumps(output, indent=2, ensure_ascii=False)

    def generate_markdown(self) -> str:
        """Genera un reporte Markdown detallado y estructurado."""
        md = []
        md.append("# 🗺️ Mapa de Arquitectura y Referencia del Proyecto")
        md.append(f"**Directorio Base:** `{self.root_dir}`\n")

        # 1. Resumen Ejecutivo
        md.append("## 📊 1. Resumen General del Repositorio")
        md.append(f"- **Archivos analizados:** `{self.stats['total_files']}`")
        md.append(f"- **Líneas de código totales:** `{self.stats['total_lines']:,}`")
        md.append(f"- **Rutas identificadas (Expo / Next.js):** `{self.stats['routes_count']}`")
        md.append(f"- **Componentes React identificados:** `{self.stats['components_count']}`")
        md.append(f"- **Custom Hooks identificados:** `{self.stats['hooks_count']}`")
        md.append(f"- **Tablas SQL detectadas:** `{self.stats['sql_tables_count']}`\n")

        # Distribución por categoría
        md.append("### Distribución por Capas")
        md.append("| Capa / Dominio | Archivos |")
        md.append("| :--- | :--- |")
        for cat, count in sorted(self.stats["by_category"].items(), key=lambda x: -x[1]):
            md.append(f"| {cat} | {count} |")
        md.append("")

        # 2. Rutas y Pantallas
        md.append("## 🧭 2. Mapa de Rutas y Pantallas")
        mobile_routes = []
        web_routes = []
        for f in self.files_data:
            routes = f["context"].get("routes", [])
            for r in routes:
                if "Expo Route" in r:
                    mobile_routes.append((r.replace("Expo Route: ", ""), f["path"]))
                elif "Next.js" in r:
                    web_routes.append((r, f["path"]))

        if mobile_routes:
            md.append("### 📱 Aplicación Móvil (Expo Router - `app/`)")
            md.append("| Ruta Móvil | Archivo de Origen |")
            md.append("| :--- | :--- |")
            for r, p in sorted(mobile_routes):
                md.append(f"| `{r}` | [`{p}`](file:///{p}) |")
            md.append("")

        if web_routes:
            md.append("### 💻 Panel Web Administrativo (Next.js App Router - `panel/src/app/`)")
            md.append("| Tipo y Ruta Web | Archivo de Origen |")
            md.append("| :--- | :--- |")
            for r, p in sorted(web_routes):
                md.append(f"| {r} | [`{p}`](file:///{p}) |")
            md.append("")

        # 3. Base de Datos Supabase
        md.append("## 🗄️ 3. Modelo de Datos y Backend (Supabase SQL)")
        sql_files = [f for f in self.files_data if f["extension"] == ".sql"]
        for f in sql_files:
            ctx = f["context"]
            md.append(f"### Archivo: [`{f['path']}`](file:///{f['path']}) ({f['line_count']} líneas)")
            if ctx.get("tables"):
                md.append(f"- **Tablas:** " + ", ".join([f"`{t}`" for t in ctx["tables"]]))
            if ctx.get("views"):
                md.append(f"- **Vistas:** " + ", ".join([f"`{v}`" for v in ctx["views"]]))
            if ctx.get("functions"):
                md.append(f"- **Funciones:** " + ", ".join([f"`{fn}`" for fn in ctx["functions"]]))
            if ctx.get("policies"):
                md.append(f"- **Políticas RLS ({len(ctx['policies'])}):**")
                for pol in ctx["policies"][:8]:  # mostrar primeras 8
                    md.append(f"  - `{pol}`")
                if len(ctx["policies"]) > 8:
                    md.append(f"  - *... y {len(ctx['policies']) - 8} políticas más*")
            if ctx.get("triggers"):
                md.append(f"- **Triggers:** " + ", ".join([f"`{tr}`" for tr in ctx["triggers"]]))
            md.append("")

        # 4. Componentes y Hooks Reutilizables
        md.append("## 🧩 4. Catálogo de Componentes y Hooks Clave")
        comp_files = [f for f in self.files_data if f["context"].get("components") or f["context"].get("hooks")]
        md.append("| Archivo | Componentes / Funciones | Hooks |")
        md.append("| :--- | :--- | :--- |")
        for f in comp_files:
            comps = ", ".join([f"`{c}`" for c in f["context"].get("components", [])]) or "-"
            hooks = ", ".join([f"`{h}`" for h in f["context"].get("hooks", [])]) or "-"
            md.append(f"| [`{f['path']}`](file:///{f['path']}) | {comps} | {hooks} |")
        md.append("")

        # 5. Estructura Completa de Archivos
        md.append("## 📁 5. Estructura Detallada de Archivos y Símbolos")
        current_category = ""
        for f in self.files_data:
            if f["category"] != current_category:
                current_category = f["category"]
                md.append(f"\n### {current_category}")

            ctx_summary = []
            ctx = f["context"]
            if ctx.get("components"):
                ctx_summary.append("comps: " + ", ".join(ctx["components"]))
            if ctx.get("hooks"):
                ctx_summary.append("hooks: " + ", ".join(ctx["hooks"]))
            if ctx.get("functions"):
                ctx_summary.append("fns: " + ", ".join(ctx["functions"][:5]))
            if ctx.get("types_interfaces"):
                ctx_summary.append("types: " + ", ".join(ctx["types_interfaces"][:5]))
            if ctx.get("tables"):
                ctx_summary.append("tables: " + ", ".join(ctx["tables"][:5]))
            if ctx.get("summary"):
                ctx_summary.append(ctx["summary"])

            details = f" *({'; '.join(ctx_summary)})*" if ctx_summary else ""
            md.append(f"- [`{f['path']}`](file:///{f['path']}) — `{f['line_count']} líneas`{details}")

        md.append("\n---\n*Generado automáticamente por `tools/code_inspector.py`*")
        return "\n".join(md)

    def generate_text_tree(self) -> str:
        """Genera una vista en texto plano estilo árbol."""
        lines = []
        lines.append(f"PROJECT MAP: {self.root_dir.name}")
        lines.append("=" * 60)
        lines.append(f"Total files: {self.stats['total_files']} | Total lines: {self.stats['total_lines']}")
        lines.append("-" * 60)

        for f in self.files_data:
            ctx = f["context"]
            notes = []
            if ctx.get("routes"):
                notes.append("routes: " + ", ".join(ctx["routes"]))
            elif ctx.get("components"):
                notes.append("comps: " + ", ".join(ctx["components"]))
            elif ctx.get("tables"):
                notes.append("tables: " + ", ".join(ctx["tables"]))
            elif ctx.get("hooks"):
                notes.append("hooks: " + ", ".join(ctx["hooks"]))
            note_str = f" [{'; '.join(notes)}]" if notes else ""
            lines.append(f"{f['path']} ({f['line_count']}L){note_str}")

        return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Explorador y generador de mapa interno del proyecto para agentes de IA y desarrolladores."
    )
    parser.add_argument(
        "--root", "-r",
        default=".",
        help="Directorio raíz del proyecto (default: actual)"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["markdown", "json", "text"],
        default="markdown",
        help="Formato de salida (default: markdown)"
    )
    parser.add_argument(
        "--output", "-o",
        help="Ruta de archivo para guardar el resultado (ej. project_map.md, project_map.json)"
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Guarda automáticamente el mapa en 'project_map.md' y 'project_map.json'"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="No imprime el reporte en stdout (útil al guardar en archivo)"
    )

    args = parser.parse_args()
    root_path = Path(args.root).resolve()

    inspector = CodeInspector(root_path)
    inspector.scan()

    # Formateo de salida principal
    if args.format == "json":
        result = inspector.generate_json()
    elif args.format == "text":
        result = inspector.generate_text_tree()
    else:
        result = inspector.generate_markdown()

    # Si se especificó guardar automáticamente
    if args.save:
        md_path = root_path / "project_map.md"
        json_path = root_path / "project_map.json"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(inspector.generate_markdown())
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(inspector.generate_json())
        print(f"[+] Mapa guardado con éxito en:")
        print(f"    - {md_path}")
        print(f"    - {json_path}")

    # Guardado personalizado si se especificó --output
    if args.output:
        out_path = Path(args.output).resolve()
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"[+] Salida guardada en: {out_path}")

    # Impresión por stdout si no es silencioso
    if not args.quiet and not args.save and not args.output:
        print(result)


if __name__ == "__main__":
    main()
