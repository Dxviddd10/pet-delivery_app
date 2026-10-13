import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import {
  AdoptionRequest, Appointment, FeedListing, ListingDetail, Order, Pet, Product, Service, Vet,
  type Species,
} from '@/lib/schemas';
import { useAuth } from '@/providers/AuthProvider';

// ---------- Adopción ----------
export function useAdoptionFeed(species: Species | null) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['adoption-feed', session?.user.id, species],
    enabled: !!session,
    staleTime: Infinity, // el feed no se refresca solo: evita saltos de tarjetas mientras se desliza
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_adoption_feed', { p_species: species, p_limit: 30 });
      if (error) throw error;
      return z.array(FeedListing).parse(data);
    },
  });
}

export function useSwipe() {
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { listingId: string; action: 'like' | 'pass' }) => {
      if (!session) throw new Error('No autenticado');
      const { error } = await supabase
        .from('adoption_swipes')
        .upsert(
          { user_id: session.user.id, listing_id: input.listingId, action: input.action },
          { onConflict: 'user_id,listing_id' },
        );
      if (error) throw error;
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adoption_listings')
        .select('id, name, species, description, vets(name, whatsapp)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return ListingDetail.parse(data);
    },
  });
}

export type AdoptionRequestInput = {
  listingId: string;
  housingType: string;
  hasOtherPets: boolean;
  hasChildren: boolean;
  message: string;
};

export function useRequestAdoption() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdoptionRequestInput) => {
      if (!session) throw new Error('No autenticado');
      const { error } = await supabase.from('adoption_requests').insert({
        listing_id: input.listingId,
        user_id: session.user.id,
        housing_type: input.housingType,
        has_other_pets: input.hasOtherPets,
        has_children: input.hasChildren,
        message: input.message.trim() || null,
      });
      if (error) {
        if (error.code === '23505') throw new Error('Ya enviaste una solicitud para esta mascota.');
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-adoption-requests'] }),
  });
}

export function useMyAdoptionRequests() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-adoption-requests', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adoption_requests')
        .select('id, status, created_at, adoption_listings(name, vets(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return z.array(AdoptionRequest).parse(data);
    },
  });
}

// ---------- Veterinarias y servicios ----------
const VET_COLUMNS = 'id, name, description, phone, whatsapp, address, offers_home_visits, home_fee, delivery_fee';

export function useVets() {
  return useQuery({
    queryKey: ['vets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vets').select(VET_COLUMNS).eq('status', 'active').order('name');
      if (error) throw error;
      return z.array(Vet).parse(data);
    },
  });
}

export function useVet(id: string | null) {
  return useQuery({
    queryKey: ['vet', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('vets').select(VET_COLUMNS).eq('id', id!).single();
      if (error) throw error;
      return Vet.parse(data);
    },
  });
}

export function useServices(vetId: string) {
  return useQuery({
    queryKey: ['services', vetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, vet_id, name, category, duration_min, price, home_available')
        .eq('vet_id', vetId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return z.array(Service).parse(data);
    },
  });
}

// ---------- Mascotas del usuario ----------
export function useMyPets() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-pets', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, sex, weight_kg')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return z.array(Pet).parse(data);
    },
  });
}

export type NewPetInput = {
  name: string;
  species: Species;
  breed: string;
  sex: 'male' | 'female' | null;
  weightKg: number | null;
};

export function useCreatePet() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPetInput) => {
      if (!session) throw new Error('No autenticado');
      const { error } = await supabase.from('pets').insert({
        owner_id: session.user.id,
        name: input.name.trim(),
        species: input.species,
        breed: input.breed.trim() || null,
        sex: input.sex,
        weight_kg: input.weightKg,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-pets'] }),
  });
}

// ---------- Citas ----------
export type AppointmentInput = {
  vetId: string;
  serviceId: string;
  petId: string;
  mode: 'in_clinic' | 'home';
  scheduledAt: Date;
  address: string;
  notes: string;
};

export function useRequestAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { error } = await supabase.rpc('request_appointment', {
        p_vet_id: input.vetId,
        p_service_id: input.serviceId,
        p_pet_id: input.petId,
        p_mode: input.mode,
        p_scheduled_at: input.scheduledAt.toISOString(),
        p_address: input.mode === 'home' ? input.address : null,
        p_notes: input.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  });
}

export function useMyAppointments() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-appointments', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, mode, scheduled_at, status, total, vets(name), services(name), pets(name)')
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return z.array(Appointment).parse(data);
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('cancel_my_appointment', { p_id: id, p_reason: 'Cancelada por el usuario' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  });
}

// ---------- Tienda y pedidos ----------
export function useProducts(params: { search: string; vetId: string | null }) {
  return useQuery({
    queryKey: ['products', params.search, params.vetId],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('id, vet_id, name, brand, price, stock, kind, images, vets(name)')
        .eq('is_active', true)
        .neq('kind', 'rx_medicine') // MVP: sin medicamentos con fórmula
        .order('name')
        .limit(100);
      const term = params.search.trim().replace(/[%,]/g, ' ');
      if (term) q = q.ilike('name', `%${term}%`);
      if (params.vetId) q = q.eq('vet_id', params.vetId);
      const { data, error } = await q;
      if (error) throw error;
      return z.array(Product).parse(data);
    },
  });
}

export type OrderInput = {
  vetId: string;
  items: { product_id: string; quantity: number }[];
  deliveryMode: 'pickup' | 'delivery';
  address: string;
  paymentMethod: 'cash_on_delivery' | 'transfer';
  notes: string;
};

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrderInput) => {
      const { error } = await supabase.rpc('create_order', {
        p_vet_id: input.vetId,
        p_items: input.items,
        p_delivery_mode: input.deliveryMode,
        p_address: input.deliveryMode === 'delivery' ? input.address : null,
        p_payment_method: input.paymentMethod,
        p_notes: input.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useMyOrders() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['my-orders', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, delivery_mode, total, created_at, vets(name), order_items(name, quantity)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return z.array(Order).parse(data);
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('cancel_my_order', { p_order_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
