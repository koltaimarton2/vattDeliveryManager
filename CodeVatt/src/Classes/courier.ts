interface Courier {
    id: string,
    name: string,
    zone: string,
    vehicle: string,
    status: 'idle'|'pending'|'offline',
    rating: number  ,
    canSpeakHun: boolean
}