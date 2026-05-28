import type { Courier } from "../Interfaces/courier";



const BASE_URL = "http://localhost:3000/couriers";
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCouriers(): Promise<Courier[]> {
    const response = fetch(BASE_URL, {method: "GET"})
    if (!(await response).ok) {
        console.error("HTTP error:", (await response).status)
    }
    return (await response).json();
}

export async function getCourier(id: string) : Promise<Courier>{
    return await(await fetch(`http://localhost:3000/couriers/${id}`)).json()
}


export async function createCourier(courier: Courier) : Promise<Courier>{
    const response = fetch(BASE_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(courier)
    })
    return (await response).json()
}


export async function editCourier(courier: Courier): Promise<Courier> {
    const response = fetch(`${BASE_URL}/${courier.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(courier)
    })
    return (await response).json()
}


export async function deleteCourier(id: string) : Promise<void>{
    await fetch(`${BASE_URL}/${id}`, {method: "DELETE"})
}


export async function updateCourierStatus(id: string, status: 'idle'|'pending'|'offline') {
    const response = fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status: status})
    })
    return (await response).json();
}

export async function updateCourierProgress(id: string, progress: number) {
    const response = fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({progress: progress})
    })
    return (await response).json();
}


