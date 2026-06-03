import { calculateDeliveryTime, simulateDelivery } from "./Service/joint-functions";
import { getCouriers, createCourier, getStatusCouriers, editCourier, deleteCourier, updateCourierStatus } from "./Service/courier-service";
import { getPackages, createPackage, getStatusPackages } from "./Service/package-service";
import type { Courier } from "./Interfaces/courier";
import type { Package } from "./Interfaces/package";


const appElement = document.getElementById("app")!;
let currentView: 'home' | 'packages' | 'couriers' = 'home';

let isAutoAssign= false;
let isAssigning = false;

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
        html += `<p class="text-center text-white  w-100 mt-4">Még nincs sikeresen kézbesített rendelés. <br><span class="fw-bold">Legyél te az első!</span></p>`;
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
    <div class="row">
        <div class="col-md-6 card bg-dark text-white border-secondary orders overflow-auto p-4 mb-5 shadow">
            <div class="d-flex justify-content-between">
                <h5 class="text-warning mb-3">Várakozó rendelések</h5>
                <div>
                    <label for="autoAssign" class="form-label fw-bold text-white" >Autó-kiosztás</label>
                    <input class="form-check-input" type="checkbox" id="autoAssign" ${isAutoAssign ? "checked" : ""} >
                </div>
            </div>
    `
    if (waitingOrders.length === 0) {
        html += `<p class="text-white fw-bold">Jelenleg nincs felvett rendelés.</p>`;
    }
    else {
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

    }
    
    html += `
    </div>
    <div class="col-md-6 card bg-dark text-white  border-secondary orders overflow-auto p-4 mb-5 shadow">
            <h5 class="text-warning mb-3">Szállítás alatt</h5>
            <div id="pending-orders-container">
            </div> </div>
        </div>
    `

    
    appElement.innerHTML = html;

    await renderPendingOrders();
    
}

async function renderPendingOrders() :Promise<void> {
    const couriers = await getCouriers()

    const container = document.getElementById("pending-orders-container")
    if (!container) return;

    const pendingOrders = await getStatusPackages('pending');
    let html="";
    if (pendingOrders.length === 0) {
        html += `<p class="text-white fw-bold">Jelenleg nincs aktív kiszállítás.</p>`;
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
        
    }
    container.innerHTML = html;
    
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
            await createPackage(newPackage);
            alert("Rendelés felvéve!")
            await renderPackages();

            if (isAutoAssign) {
                await autoAssign();
            }   
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
        
        setTimeout(async () => {
            if (currentView === 'packages') await renderPackages();
        }, 50);

        await executeDelivery(courierId, packageID);
        renderPackages();
    }
});


appElement.addEventListener("change", async(e)=> {
    const target = e.target as HTMLInputElement
    if (target.id == "autoAssign") {
        isAutoAssign = target.checked
        if (isAutoAssign) {
            await autoAssign();
        }
    }
})



async function executeDelivery(courierId: string, packageID: string) {

    await simulateDelivery(courierId, packageID, async () => {
        if (currentView === 'packages') {
            await renderPendingOrders();
            const pendingOrders = await getStatusPackages('pending');
            const isStillPending = pendingOrders.some(p => p.id === packageID);
            if (!isStillPending) {
                await renderPackages();


                if (isAutoAssign) {
                    await autoAssign();
                }
            }
        }
    });

    await renderPackages();
}

async function autoAssign() {
    if (!isAutoAssign || currentView !== "packages" || isAssigning) return;
    isAssigning = true;
    try {
        let waitingPacks = await getStatusPackages('waiting');
        let idleCouriers = await getStatusCouriers('idle');

        while (waitingPacks.length > 0 && idleCouriers.length > 0) {
            const pack = waitingPacks[0];
            const courier = idleCouriers[0];

            waitingPacks.shift();
            idleCouriers.shift();

            await executeDelivery(courier.id, pack.id);
        }
        await renderPackages();
    } finally {
        isAssigning = false;
    }
}

async function renderCouriers() {
    const couriers = await getCouriers();
    let cardsHtml = '';

    couriers.forEach(courier => {

        let vehicleName = 'Autó';
        if (courier.vehicle === 'bike') vehicleName = 'Kerékpár';
        if (courier.vehicle === 'motorcycle') vehicleName = 'Motorkerékpár';

        let statusBadge = `<span class="badge bg-success">Elérhető</span>`;
        if (courier.status === 'pending') statusBadge = `<span class="badge bg-warning text-dark">Kiszállítás alatt</span>`;
        if (courier.status === 'offline') statusBadge = `<span class="badge bg-danger">Inaktív</span>`;

        cardsHtml += `
            <div class="col-md-4 mb-4">
                <div class="card bg-dark text-white border-secondary mb-2 shadow">
                    <div class="card-header border-secondary d-flex justify-content-between">
                        <strong>${courier.name}</strong>
                        ${statusBadge}
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title text-warning">${courier.zone}</h5>
                            <div class="form-check form-switch">
                                <input class="form-check-input online-switch" ${courier.status == "pending" ? "disabled" : ""} data-id="${courier.id}" type="checkbox" ${courier.status != "offline" ? "checked" : ""} role="switch" >
                            </div>
                        </div>

                        <p class="card-text text-light">${vehicleName}t vezet</p>
                        ${courier.canSpeakHun ? "Beszél magyarul" : "Nem beszél magyarul"}
                    </div>
                    <div class="card-footer border-secondary  small">
                        <div class="d-flex justify-content-between align-items-center">
                            <button class="btn btn-sm bg-purple ${courier.status == "pending" ? "disabled" : ""} text-white edit-courier-btn" data-id="${courier.id}">Szerkesztés</button>
                            <button class="btn btn-sm btn-danger ${courier.status == "pending" ? "disabled" : ""} delete-courier-btn" data-id="${courier.id}">Törlés</button>
                            <p class="card-text text-light text-end">Értékelés: ${courier.rating}</p>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
    });

    appElement.innerHTML = `
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="text-white partnereink  mb-0">Futárok Kezelése</h1>
                <button class="btn btn-success px-4" id="addNewCourierBtn">Új futár</button>
            </div>
            <div class="row justify-content-center">
                ${cardsHtml || '<p class="text-muted text-center mt-5">Nincs regisztrált futár a rendszerben.</p>'}
            </div>
        </div>
    `;

    
    document.getElementById('addNewCourierBtn')?.addEventListener('click', () => renderCourierForm());

    
    document.querySelectorAll('.edit-courier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {

            const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
            const courier = couriers.find(c => c.id === id);
            if (courier) {
                renderCourierForm(courier);
            }
        });
    });

    document.querySelectorAll('.online-switch').forEach(check => {
        check.addEventListener('change', async (e) => {

            const id = (e.currentTarget as HTMLInputElement).getAttribute('data-id') as string;
            const courier = couriers.find(c => c.id === id);
            if (courier) {
                if (!(e.currentTarget as HTMLInputElement).checked) {
                    await updateCourierStatus(id, "offline");
                }
                else {
                    await updateCourierStatus(id, "idle");

                }
                await renderCouriers()
            }
        });
    });


    document.querySelectorAll('.delete-courier-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-id');
            if (id && confirm('Biztosan törölni szeretnéd ezt a futárt?')) {
                await deleteCourier(id);
                renderCouriers();
            }
        });
    });

}

function renderCourierForm(courier?: Courier) {
    const isEdit = !!courier;
    
    appElement.innerHTML = `
        <div class="container mt-4 text-white" style="max-width: 600px;">
            <h2 class="mb-4 text-center">${isEdit ? 'Futár Adatainak Módosítása' : 'Új Futár Regisztrálása'}</h2>
            <form id="courierForm" class="bg-dark p-4 rounded border border-secondary shadow">
                <div class="mb-3">
                    <label for="courierName" class="form-label">Futár Neve</label>
                    <input type="text" class="form-control bg-secondary text-white border-0" id="courierName" value="${courier ? courier.name : ''}">
                    <p class="text-danger fw-bold" id="courierNameError"></p>
                </div>
                <div class="mb-3">
                    <label for="courierZone" class="form-label">Működési Zóna</label>
                    <input type="text" class="form-control bg-secondary text-white border-0" id="courierZone" value="${courier ? courier.zone : ''}">
                    <p class="text-danger fw-bold" id="courierZoneError"></p>
                </div>
                <div class="mb-3">
                    <label for="courierVehicle" class="form-label">Szállító Jármű</label>
                    <select class="form-select bg-secondary text-white border-0" id="courierVehicle">
                        <option value="bike" ${courier?.vehicle === 'bike' ? 'selected' : ''}>Kerékpár</option>
                        <option value="motorcycle" ${courier?.vehicle === 'motorcycle' ? 'selected' : ''}>Motorkerékpár</option>
                        <option value="car" ${courier?.vehicle === 'car' ? 'selected' : ''}>Autó</option>
                    </select>
                </div>
                <div class="mb-4 form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="courierSpeakHun" ${courier?.canSpeakHun ? 'checked' : ''}>
                    <label class="form-check-label" for="courierSpeakHun">Beszél magyarul</label>
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary px-4" id="cancelCourierForm">Mégse</button>
                    <button type="submit" class="btn btn-success px-4">${isEdit ? 'Mentés' : 'Létrehozás'}</button>
                </div>
            </form>
        </div>
    `;

    
    document.getElementById('courierForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isError = false;
        const courierName = document.getElementById('courierName') as HTMLInputElement;
        const courierZone = document.getElementById('courierZone') as HTMLInputElement;
        const courierVehicle = document.getElementById('courierVehicle') as HTMLSelectElement;
        const courierSpeakHun = document.getElementById('courierSpeakHun') as HTMLInputElement;
        const courierNameErrorP = document.getElementById('courierNameError') as HTMLParagraphElement;
        const courierZoneErrorP = document.getElementById('courierZoneError') as HTMLParagraphElement;

      
        courierNameErrorP.innerText = "";
        courierZoneErrorP.innerText = "";

        courierName.style.border = "";
        courierZone.style.border = "";

        let nameError = checkCourierName(courierName.value);
        if (nameError != null) {
            courierName.style.border = "2px solid red";
            courierNameErrorP.innerText = nameError;
            isError = true;
        }

        let zoneError = checkCourierZone(courierZone.value);
        if (zoneError != null) {
            courierZone.style.border = "2px solid red";
            courierZoneErrorP.innerText = zoneError;
            isError = true;
        }

        if (isError) {
            return;
        }

        const name = courierName.value;
        const zone = courierZone.value;
        const vehicle = courierVehicle.value as 'bike' | 'motorcycle' | 'car';
        const canSpeakHun = courierSpeakHun.checked;

        if (isEdit && courier) {
            const updatedCourier: Courier = {
                ...courier,
                name,
                zone,
                vehicle,
                canSpeakHun
            };
            await editCourier(updatedCourier);
        } else {
            const newCourier: Courier = {
                id: 'c_' + Date.now(), 
                name,
                zone,
                vehicle,
                status: 'idle',
                rating: 5.0,
                canSpeakHun,
                progress: 0
            };
            await createCourier(newCourier);
            alert("Futár regisztrálva!");
        }
        renderCouriers();

    });

    document.getElementById('cancelCourierForm')?.addEventListener('click', () => {
        renderCouriers();
    });
}

function checkCourierName(name: string) : string | null {
    if (name.trim() == "") {
        return "Kérlek adjon meg egy nevet!";
    }
    else if (name.length < 4) {
        return "Kérlek adjon meg egy hosszabb nevet!";
    }
    else if (name.length > 25) {
        return "Kérlek adjon meg egy rövidebb nevet!";
    }
    return null;
}

function checkCourierZone(zone: string) : string | null {
    if (zone.trim() == "") {
        return "Kérlek adjon meg egy zónát!";
    }
    return null;
}
function render() {
    if (currentView === 'home') renderHome();
    else if (currentView === 'packages') renderPackages();
    else if (currentView === 'couriers') renderCouriers();
}

renderHome()




