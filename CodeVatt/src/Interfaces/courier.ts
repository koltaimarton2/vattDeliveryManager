export interface Courier {
    id: string,
    name: string,
    zone: string,
    vehicle: 'bike'| 'motorcycle' | 'car',
    status: 'idle'|'pending'|'offline',
    rating: number  ,
    canSpeakHun: boolean,
    progress:number;
}