import { calculateDeliveryTime, simulateDelivery } from "./Service/joint-functions";
import { getCouriers, createCourier, getStatusCouriers } from "./Service/courier-service";
import { getPackages, createPackage, getStatusPackages } from "./Service/package-service";
import type { Courier } from "./Interfaces/courier";
import type { Package } from "./Interfaces/package";


const appElement = document.getElementById("app")!;
let currentView: 'home' | 'packages' | 'couriers' = 'home';

let allCouriers: Courier[] = [];
let allPackages: Package[] = [];

document.getElementById("nav-home")?.addEventListener("click", (e) => { e.preventDefault(); currentView = 'home';  render()});
document.getElementById("nav-packages")?.addEventListener("click", (e) => { e.preventDefault(); currentView = 'packages'; render()  });
document.getElementById("nav-couriers")?.addEventListener("click", (e) => { e.preventDefault(); currentView = 'couriers'; render() });
document.getElementById("brand-logo")?.addEventListener("click", (e) => { e.preventDefault(); currentView = 'home'; render() });


async function renderHome() {
    const doneOrders = await getStatusPackages('done');
    
    let html = `
        <img src="public/logo.png" class="mt-5 rounded mx-auto d-block logo" alt="logó" style="max-height: 250px;">
        <h1 class="text-center mt-1 nev">Vatt</h1>
        <p class="mt-4 szovegecske text-center">
            Cégünk alapításakor egy olyan ételkiszállító szolgáltatást álmodtunk meg, amely a rohanó mindennapokban maximális kényelmet és megbízhatóságot nyújt...
        </p>
        <h1 class="text-center mt-5 partnereink text-white">Sikeres rendeléseink (${doneOrders.length})</h1>
        <div class="row row-cols-1 row-cols-md-3 g-4 mt-2 justify-content-center">
    `;



    if (doneOrders.length === 0) {
        html += `<p class="text-center text-muted w-100 mt-4">Még nincs sikeresen kézbesített rendelés.</p>`;
    } else {
        doneOrders.forEach(pack => {
            html += `
                <div class="col">
                    <div class="card bg-dark text-white border-secondary h-100 shadow">
                        <div class="card-header border-secondary d-flex justify-content-between">
                            <strong>${pack.customerName}</strong>
                            <span class="badge bg-purple" >${pack.customerZone} zóna</span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title text-warning">${pack.restaurant}</h5>
                            <p class="card-text text-light">${pack.order}</p>
                        </div>
                        <div class="card-footer border-secondary text-end small">
                            Állapot: Kézbesítve 🏁
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    appElement.innerHTML = html;
}


async function renderPackages() {
    const waitingOrders = await getStatusPackages('waiting');
    const pendingOrders = await getStatusPackages('pending');
    const idleCouriers = await getStatusCouriers('idle');

    let html = `
    <h1 class="text-white partnereink text-center mb-4 mt-3">Rendeléskezelő Panel</h1>  
        <div class="card bg-dark text-white border-secondary p-4 mb-5 shadow">
            <h5 class="text-warning mb-3">Új rendelés felvétele</h5>
            <form id="new-package-form" class="row g-3">
                <div class="col-md-3">
                    <input type="text" id="custName" class="form-control bg-secondary text-white border-0" placeholder="Vevő neve" >
                    <p class="text-danger fw-bold" id="custNameError"></p>
                </div>
                <div class="col-md-2">
                    <input type="text" id="custZone" class="form-control bg-secondary text-white border-0" placeholder="Zóna (pl. Belváros)" >
                    <p class="text-danger fw-bold" id="custZoneError"></p>
                </div>
                <div class="col-md-3">
                    <input type="text" id="restaurant" class="form-control bg-secondary text-white border-0" placeholder="Étterem" >
                    <p class="text-danger fw-bold" id="restaurantError"></p>
                </div>
                <div class="col-md-4">
                    <input type="text" id="orderDesc" class="form-control bg-secondary text-white border-0" placeholder="Étel leírása (pl. Sajtos Pizza)" >
                    <p class="text-danger fw-bold" id="orderError"></p>
                </div>
                <div class="col-12 d-flex justify-content-between align-items-center">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="isFragile">
                        <label class="form-check-label" for="isFragile">Törékeny / Érzékeny szállítmány</label>
                    </div>
                    <button type="submit" class="btn text-white px-4" style="background-color: #800080;">Rendelés Mentése</button>
                </div>
            </form>
        </div>
    `;

    html +=  ` 
    <div class="row ">
        <div class="col-md-6 card bg-dark text-white border-secondary orders overflow-auto p-4 mb-5 shadow">
            <h5 class="text-warning mb-3">Várakozó rendelések</h5>

    `
    waitingOrders.forEach(order => {
        html += `
        <div class="col mb-2">
            <div class="card bg-dark text-white border-secondary h-100 shadow">
                <div class="card-header border-secondary d-flex justify-content-between">
                    <strong>${order.customerName}</strong>
                    <span class="badge bg-purple" >${order.customerZone} zóna</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title text-warning">${order.restaurant}</h5>
                    <p class="card-text text-light">${order.order}</p>
                    <div class="input-group">
                        <select id="select-courier-${order.id}" class="form-select bg-secondary text-white border-0">
                            <option value="">Válassz szabad futárt!</option>
                            ${idleCouriers.map(c => `<option value="${c.id}">${c.name} (${c.vehicle} - ${c.zone} zóna) ETA: ${calculateDeliveryTime(c, order)} perc</option>`).join('')}
                        </select>
                        <button class="btn bg-purple text-white btn-start-delivery" data-package-id="${order.id}">Kiosztás</button>
                    </div>
                </div>


                <div class="card-footer border-secondary text-end small">
                    ${order.fragile ? "Érzékeny csomag" : "Normális csomag"}
                </div>
            </div>
        </div>
        `
    })
    html += `
    </div>
    <div class="col-md-6 card bg-dark text-white  border-secondary overflow-auto p-4 mb-5 shadow">
            <h5 class="text-warning mb-3">Szállítás alatt</h5>
    `

    if (pendingOrders.length === 0) {
        html += `<p class="text-muted">Jelenleg nincs aktív kiszállítás.</p>`;
    } else {
        pendingOrders.forEach(pack => {
            html += `
            <div class="col mb-2">
                <div class="card bg-dark text-white border-secondary mb-2 shadow">
                    <div class="card-header border-secondary d-flex justify-content-between">
                        <strong>${pack.customerName}</strong>
                        <span class="badge bg-purple" >${pack.customerZone} zóna</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-warning">${pack.restaurant}</h5>
                        <p class="card-text text-light">${pack.order}</p>
                    </div>
                    <div class="card-footer border-secondary text-end small">
                        <div class="progress bg-secondary">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-purple text-white fw-bold" role="progressbar" style="width: ${pack.progress || 0}%;">${pack.progress || 0}%</div>
                    </div>
                </div>
            </div>
            </div>
            `;
        });
        html += `
            </div>
        </div>
        `
    }
    appElement.innerHTML = html;
}


appElement.addEventListener('submit', async (e) => {
    const target = e.target as HTMLFormElement;
    if (target.id == "new-package-form") {

        e.preventDefault();

        let isError = false;

        const custName = document.getElementById("custName") as HTMLInputElement;
        const custZone = document.getElementById("custZone") as HTMLInputElement;
        const restaurant = document.getElementById("restaurant") as HTMLInputElement;
        const order = document.getElementById("orderDesc") as HTMLInputElement;
        const fragile = document.getElementById("isFragile") as HTMLInputElement;

        const custNameErrorP = document.getElementById("custNameError") as HTMLParagraphElement;
        const custZoneErrorP = document.getElementById("custZoneError") as HTMLParagraphElement;
        const restaurantErrorP = document.getElementById("restaurantError") as HTMLParagraphElement;
        const orderErrorP = document.getElementById("orderError") as HTMLParagraphElement;

        custNameErrorP.innerText = "";
        custZoneErrorP.innerText = "";
        restaurantErrorP.innerText = "";
        orderErrorP.innerText = "";


        custName.style.border = "";
        custZone.style.border = "";
        restaurant.style.border = "";
        order.style.border = "";

        let nameError = checkName(custName.value);
        if (nameError != null) {
            custName.style.border = "2px solid red";
            custNameErrorP.innerText = nameError;
            isError = true;
        }
        let zoneError = checkZone(custZone.value);
        if (zoneError != null) {
            custZone.style.border = "2px solid red"
            custZoneErrorP.innerText = zoneError;
            isError = true;
        }
        let restError = checkRestaurant(restaurant.value);
        if (restError != null) {
            restaurant.style.border = "2px solid red"
            restaurantErrorP.innerText = restError;
            isError = true;
        }
        let orderError = checkOrder(order.value);
        if (orderError != null) {
            order.style.border = "2px solid red"
            orderErrorP.innerText = orderError;
            isError = true;
        }

        if (isError) {
            return;
        }


        const newPackage: Package = {
            id: String(Date.now()),
            customerName: custName.value,
            customerZone: custZone.value,
            restaurant: restaurant.value,
            order: order.value,
            fragile: fragile.checked, 
            status: 'waiting',  
            courierId: null,
            progress: 0
        }

        try {
            createPackage(newPackage);
            alert("Rendelés felvéve!")
            renderPackages();
        } 
        catch (error) {
            console.error(error)
        }

    }

})


function checkName(name: string) : string | null {
    if (name.trim () == "") {
        return "Kérlek adjon meg egy nevet!"
    }
    else if (name.length < 4) {
        return "Kérlek adjon meg egy hosszabb nevet!"
    }
    else if (name.length > 25) {
        return "Kérlek adjon meg egy rövidebb nevet!"
    }
    return null;
}
function checkZone(zone: string) : string | null {
    if (zone.trim () == "") {
        return "Kérlek adjon meg egy zónát!"
    }
    return null;
}
function checkRestaurant(restaurant: string) : string | null {
    if (restaurant.trim () == "") {
        return "Kérlek adjon meg egy éttermet!"
    }
    return null;
}

function checkOrder(order: string) : string | null {
    if (order.trim () == "") {
        return "Kérlek adjon meg egy ételt!"
    }
    return null;
}






appElement.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains('btn-start-delivery')) {

        const packageID = target.dataset.packageId as string; 
        const courierSelect = document.getElementById(`select-courier-${packageID}`) as HTMLSelectElement;
        const courierId = courierSelect.value;    

        if (!courierId) {
            alert("Kérlek válassz ki egy szabad futárt a csomaghoz!");
            courierSelect.style.border = "3px solid red";
            return;
        }
        simulateDelivery(courierId, packageID, () => {
            if (currentView === 'packages') {
                renderPackages();
         }
        });
    }
});

async function renderCouriers() {
    
}


function render() {
    if (currentView === 'home') renderHome();
    else if (currentView === 'packages') renderPackages();
    else if (currentView === 'couriers') renderCouriers();
}

renderPackages();








