import type { Courier } from "../Interfaces/courier";
import type { Package } from "../Interfaces/package";
import { getCourier, updateCourierProgress, updateCourierStatus } from "./courier-service";
import { getPackage, updatePackageProgress, updatePackageStatus } from "./package-service";

export function calculateDeliveryTime(courier: Courier, pack: Package): number {
    let baseTime = 5;

    switch (courier.vehicle) {
        case 'bike':
            baseTime += 5;
            break;
        case 'motorcycle':
            baseTime +=2
            break;
    }

    if (courier.zone != pack.customerZone) {
        baseTime += 5
    }

    if (pack.fragile) {
        baseTime +=3
    }

    return baseTime;
}


export async function simulateDelivery(courierId: string, packageId: string) {
    try {

        const courier : Courier  = await getCourier(courierId); 
        const pack  : Package = await getPackage(packageId); 

        const deliveryTime = calculateDeliveryTime(courier, pack)

        

        await updateCourierStatus(courierId, 'pending')
        await updatePackageStatus(packageId, 'pending')
        console.log(`Courier(${courierId}) has started delivering package(${packageId})`)

        let timePassed = 0;

        const myInterval = setInterval(async () => {
            timePassed++;
            
            const currentProgress = Math.round((timePassed / deliveryTime) * 100);
            console.log(`Courier(${courierId}) is delivering package(${packageId}) (${currentProgress}%)`)
            
            if (timePassed >= deliveryTime) {
                clearInterval(myInterval)
                await updateCourierProgress(courierId, Math.round((timePassed / deliveryTime )* 100))
                await updatePackageProgress(packageId, Math.round((timePassed / deliveryTime )* 100))
                await updateCourierStatus(courierId, 'idle')
                await updatePackageStatus(packageId, 'done')
                console.log(`Courier(${courierId}) has finished delivering package(${packageId})`)
                
            }
            else {
                await updateCourierProgress(courierId, currentProgress);
                await updatePackageProgress(packageId, currentProgress);
            }
        }, 1000);
    }
    catch (e){
        console.error(e)
    }
}
