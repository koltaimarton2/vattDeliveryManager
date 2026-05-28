import { simulateDelivery } from "./Service/joint-functions"
import { getStatusPackages } from "./Service/package-service";


//simulateDelivery("c2", "p1");

const apphomediv = document.getElementById("app");
let doneorders = await getStatusPackages('done');


function renderMain() {
    apphomediv!.innerHTML = ``;
    doneorders.forEach(pack => {
        const packdiv = document.createElement("div");
        packdiv.innerHTML = `<div class="card mt-4">
        <div class="card-header">
        ${pack.customerName}-${pack.customerZone}
        
        </div>
        <div class="card-body">
      <h5 class="card-title">${pack.restaurant}</h5>
      <p class="card-text">${pack.order}</p>
        </div>
        </div>`;
        apphomediv!.appendChild(packdiv);
    })
}
renderMain();