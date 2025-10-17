import React, { useEffect, useMemo, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonSearchbar,
  IonButton,
  IonList,
  IonThumbnail,
  IonImg,
  IonNote,
  IonText
} from '@ionic/react';
import { useCart } from '../context/CartContext';
import { ServiceProviderService } from '../services/serviceProviderService';
import sectors from '../config/sectorServices.json';

type ProviderResult = any;

export const ProviderSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { addItem } = useCart();

  const categories = useMemo(() => Object.keys(sectors || {}), []);

  useEffect(() => {
    // initial load - show some default providers (mocked via search with no params)
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      setErrorMessage(null);
      const params: any = {};
      if (category) params.sector = category;
      if (query) params.location = query; // server may interpret differently, but useful
      if (maxDistance) params.maxDistance = maxDistance;

      // Request a focused set of fields to reduce payload where possible.
      const fields = [
        'id',
        'name',
        'displayName',
        'pricing.baseRate as pricingBase',
        'pricing.base',
        'baseRate',
        'rate',
        'ratings as rating',
        'avatar as avatar',
        'image as image',
        'profileImage as profileImage',
        'services',
        'portfolio',
        'skills',
        'serviceAreas.locations.city as city',
        'serviceAreas.radius as radius',
        'distanceKm'
      ].join(',');

      const res = await ServiceProviderService.searchProjected(params, fields);

  // Normalize common wrapper shapes: array or { items: [], pagination } or { data: [...] }
  const resAny: any = res;
  let list: any[] = [];
  if (Array.isArray(resAny)) list = resAny;
  else if (resAny && Array.isArray(resAny.items)) list = resAny.items;
  else if (resAny && Array.isArray(resAny.data)) list = resAny.data;
  else if (resAny && Array.isArray(resAny.users)) list = resAny.users;
  else if (resAny && resAny.data && Array.isArray(resAny.data.users)) list = resAny.data.users;
  else list = [];

      // Map to normalized provider objects used by the UI
      const normalized = list.map((p: any) => {
        // projected helpers may have produced alias fields or arrays (e.g., city could be ['CityA'])
        const pricingBase = p?.pricingBase ?? p?.pricing?.baseRate ?? p?.pricing?.base ?? p?.baseRate ?? p?.rate ?? null;
        const rating = p?.rating ?? p?.ratings ?? p?.averageRating ?? null;
        const avatar = p?.avatar ?? p?.image ?? p?.profileImage ?? '';
        // city may be an array (from projection of nested arrays) or string
        // prefer direct p.city, then first serviceAreas.locations city, then addresses[0].city, finally empty string
        let city = p?.city ?? (p?.serviceAreas?.locations ? p.serviceAreas.locations[0]?.city : undefined) ?? (p?.addresses && p.addresses[0]?.city) ?? '';
        if (Array.isArray(city)) city = city.length > 0 ? city[0] : '';
        // derive services from explicit services, portfolio, or skills
        let services: any[] = [];
        if (Array.isArray(p.services)) services = p.services;
        else if (Array.isArray(p.portfolio)) services = p.portfolio;
        else if (Array.isArray(p.skills)) services = p.skills.map((s: any) => ({ name: s.name || s }));
        else if (p.services && typeof p.services === 'object') {
          // convert keyed service objects to array
          services = Object.values(p.services).map((s: any) => (typeof s === 'string' ? { name: s } : s));
        }
        const distanceKm = p.distanceKm ?? p.radius ?? p.serviceAreas?.radius ?? null;

        return {
          ...p,
          id: p.id || p.userName || p.email,
          name: p.name || p.displayName || p.userName || p.username,
          avatar,
          pricingBase,
          rating,
          services,
          city,
          distanceKm
        };
      });

      // Apply price and distance filters where applicable
      const filtered = normalized.filter((p: any) => {
        const price = p.pricingBase ?? Infinity;
        const distance = p.distanceKm ?? Infinity;
        const priceOk = price === null ? true : (price <= maxPrice);
        const distOk = distance === null ? true : (distance <= maxDistance);
        return priceOk && distOk;
      });

      setResults(filtered);
    } catch (error: any) {
      console.error('ProviderSearch.fetchProviders error:', error);
      setErrorMessage(typeof error?.message === 'string' ? error.message : 'Unable to fetch providers.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    await fetchProviders();
  };

  const handleAddToCart = (provider: any, serviceName: string, price: number) => {
    // id remains unique per service; store providerId explicitly
    const id = `${provider.id}||${serviceName}`;
    addItem({ id, name: serviceName, price, image: provider.avatar || provider.image || '/assets/banner.png', providerId: provider.id, description: provider.title || provider.headline || provider.bio });
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Find a Service Provider</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="space-y-3">
          <IonItem>
            <IonSearchbar
              value={query}
              onIonChange={(e: any) => setQuery(e.detail.value)}
              placeholder="Search by city, area or skill"
            />
          </IonItem>

          <IonItem>
            <IonLabel>Category</IonLabel>
            <IonSelect value={category} placeholder="All" onIonChange={(e) => setCategory(e.detail.value)}>
              <IonSelectOption value={undefined}>All</IonSelectOption>
              {categories.map((c) => (
                <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Max Price: <strong>${maxPrice}</strong></IonLabel>
            <IonRange value={maxPrice} min={10} max={1000} step={5} onIonChange={(e: any) => setMaxPrice(e.detail.value as number)} />
          </IonItem>

          <IonItem>
            <IonLabel>Max Distance (km): <strong>{maxDistance}km</strong></IonLabel>
            <IonRange value={maxDistance} min={1} max={200} step={1} onIonChange={(e: any) => setMaxDistance(e.detail.value as number)} />
          </IonItem>

          <div className="flex space-x-2">
            <IonButton expand="block" onClick={handleSearch} disabled={isLoading}>Search</IonButton>
            <IonButton expand="block" fill="outline" onClick={() => { setQuery(''); setCategory(undefined); setMaxDistance(20); setMaxPrice(200); fetchProviders(); }}>Reset</IonButton>
          </div>

          <div>
            <IonText>
              <p className="text-sm text-gray-500">Showing {results.length} results</p>
              {errorMessage && <p className="text-xs text-amber-600">{errorMessage}</p>}
            </IonText>
          </div>

          <IonList>
            {results.map((provider: any) => (
              <IonCard key={provider.id} className="mb-2">
                <IonCardContent className="flex items-center space-x-3">
                  <IonThumbnail slot="start" style={{ width: 72, height: 72, borderRadius: 8 }}>
                    <IonImg src={provider.avatar || provider.image || '/assets/banner.png'} />
                  </IonThumbnail>
                  <div className="flex-1">
                    <h3 className="font-semibold">{provider.name || provider.displayName || provider.username}</h3>
                    <p className="text-sm text-gray-500">{provider.title || provider.headline || provider.bio || provider.city}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <IonNote>Rating: {provider.rating || (Math.round(Math.random() * 20) / 4) + 1}</IonNote>
                      <IonNote>Distance: {provider.distanceKm || Math.round(Math.random() * 50)} km</IonNote>
                    </div>
                    {/* Render top services (if available) */}
                    {Array.isArray(provider.services) && provider.services.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {provider.services.slice(0, 3).map((s: any) => (
                          <div key={s.name} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.description}</div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-sm font-semibold">${(s.price || provider.pricing?.base || Math.round(Math.random() * 150) + 20).toFixed(2)}</div>
                              <IonButton size="small" onClick={() => handleAddToCart(provider, s.name, s.price || provider.pricing?.base || 49)}>Add</IonButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback single service if no services array */}
                    {!provider.services || provider.services.length === 0 ? (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm">Basic Service</div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-semibold">${provider.pricing?.base || 49}</div>
                          <IonButton size="small" onClick={() => handleAddToCart(provider, provider.title || 'Service', provider.pricing?.base || 49)}>Add</IonButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ProviderSearch;
