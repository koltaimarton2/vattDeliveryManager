import type { Package } from "../Interfaces/package";

const BASE_URL = "http://localhost:3000/packages"

export async function getPackages(): Promise<Package[]> {
    const response = fetch(BASE_URL, {method: "GET"})
    if (!(await response).ok) {
        console.error("HTTP error:", (await response).status)
    }
    return (await response).json();
}

export async function getPackage(id: string) : Promise<Package>{
    return await(await fetch(`http://localhost:3000/packages/${id}`)).json()
}

export async function getStatusPackages(status: 'waiting' | 'pending' | 'done'): Promise<Package[]> {
    const response = fetch(`${BASE_URL}?status=${status}`, {method: "GET"})
    if (!(await response).ok) {
        console.error("HTTP error:", (await response).status)
    }
    return (await response).json();
}

export async function createPackage(pack: Package) : Promise<Package >{
    const response = fetch(BASE_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(pack)
    })
    return (await response).json()
}

export async function updatePackageStatus(id: string, status: 'waiting' | 'pending' | 'done') {
    const response = fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status: status})
    })
    return (await response).json();
}

export async function updatePackageProgress(id: string, progress: number) {
    const response = fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({progress: progress})
    })
    return (await response).json();
}




