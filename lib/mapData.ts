export interface MapRegion {
    id: string;
    name: string;
    x: number; // Porcentaje de izquierda a derecha (0-100)
    y: number; // Porcentaje de arriba hacia abajo (0-100)
    color: string;
  }
  
  export const NOCTHERRA_MAP_REGIONS: MapRegion[] = [
    { id: 'karvok', name: 'Karvok', x: 38, y: 18, color: '#991b1b' },
    { id: 'vaelbris', name: 'Vaelbris', x: 25, y: 38, color: '#d97706' },
    { id: 'deimonmark', name: 'DeimonMark', x: 22, y: 65, color: '#7f1d1d' },
    { id: 'sylvaran', name: 'Sylvaran', x: 53, y: 45, color: '#166534' },
    { id: 'nareth', name: 'Archipiélago de Nareth', x: 58, y: 82, color: '#0369a1' },
    { id: 'mournhollow', name: 'MournHollow', x: 75, y: 65, color: '#431407' },
    { id: 'asteria', name: 'Asteria', x: 82, y: 35, color: '#ca8a04' },
    { id: 'pozo-profundo', name: 'Pozo Profundo', x: 62, y: 15, color: '#450a0a' },
  ];