interface Package {
    id: string,
    customerName: string
    customerZone: string,
    restaurant: string,
    order: string,
    fragile: boolean,
    status: 'waiting' | 'pending' | 'done'
    

}