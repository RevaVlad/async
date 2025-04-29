const API = {
    organizationList: "/orgsList",
    analytics: "/analitics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

async function run() {
    try {
        const orgOgrns = await sendRequest(API.organizationList);
        const ogrns = orgOgrns.join(",");

        const requisites = await sendRequest(`${API.orgReqs}?ogrn=${ogrns}`);
        const orgsMap = reqsToMap(requisites);

        const [analyticsResult, buhResult] = await Promise.all([
            (async () => {
                try {
                    return await sendRequest(`${API.analytics}?ogrn=${ogrns}`);
                } catch (error) {
                    console.error("Не удалось загрузить аналитику:", error.message);
                    return null;
                }
            })(),
            (async () => {
                try {
                    return await sendRequest(`${API.buhForms}?ogrn=${ogrns}`);
                } catch (error) {
                    console.error("Не удалось загрузить бухформы:", error.message);
                    return null;
                }
            })()
        ]);

        if (analyticsResult) {
            addInOrgsMap(orgsMap, analyticsResult, "analytics");
        }
        if (buhResult) {
            addInOrgsMap(orgsMap, buhResult, "buhForms");
        }

        render(orgsMap, orgOgrns);
    } catch (error) {
        console.error("Критическая ошибка:", error.message);
    }
}

async function sendRequest(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorInfo = {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            };
            alert(`Ошибка запроса:\nURL: ${errorInfo.url}\nСтатус: ${errorInfo.status} ${errorInfo.statusText}`);
            throw new Error(`HTTP error: ${errorInfo.status} ${errorInfo.statusText}`);
        }
        return await response.json();
    } catch (error) {
        if (error instanceof TypeError) {
            alert(`Сетевая ошибка: ${error.message}\nПроверьте URL: ${url}`);
            throw new Error(`Network error: ${error.message}`);
        }
        throw error;
    }
}

function reqsToMap(requisites) {
    return requisites.reduce((acc, item) => {
        acc[item.ogrn] = item;
        return acc;
    }, {});
}

function addInOrgsMap(orgsMap, additionalInfo, key) {
    for (const item of additionalInfo) {
        orgsMap[item.ogrn][key] = item[key];
    }
}

function render(organizationsInfo, organizationsOrder) {
    const table = document.getElementById("organizations");
    table.classList.remove("hide");

    const template = document.getElementById("orgTemplate");
    const container = table.querySelector("tbody");

    organizationsOrder.forEach((item) => {
        renderOrganization(organizationsInfo[item], template, container);
    });
}

function renderOrganization(orgInfo, template, container) {
    const clone = document.importNode(template.content, true);
    const name = clone.querySelector(".name");
    const indebtedness = clone.querySelector(".indebtedness");
    const money = clone.querySelector(".money");
    const address = clone.querySelector(".address");

    name.textContent =
        (orgInfo.UL && orgInfo.UL.legalName && orgInfo.UL.legalName.short) ||
        "";
    indebtedness.textContent = formatMoney(orgInfo.analytics.s1002 || 0);

    if (
        orgInfo.buhForms &&
        orgInfo.buhForms.length &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1] &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1].year === 2017
    ) {
        money.textContent = formatMoney(
            (orgInfo.buhForms[orgInfo.buhForms.length - 1].form2 &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0] &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0]
                    .endValue) ||
                0
        );
    } else {
        money.textContent = "—";
    }

    const addressFromServer = orgInfo.UL.legalAddress.parsedAddressRF;
    address.textContent = createAddress(addressFromServer);

    container.appendChild(clone);
}

function formatMoney(money) {
    let formatted = money.toFixed(2);
    formatted = formatted.replace(".", ",");

    const rounded = money.toFixed(0);
    const numLen = rounded.length;
    for (let i = numLen - 3; i > 0; i -= 3) {
        formatted = `${formatted.slice(0, i)} ${formatted.slice(i)}`;
    }

    return `${formatted} ₽`;
}

function createAddress(address) {
    const addressToRender = [];
    if (address.regionName) {
        addressToRender.push(createAddressItem("regionName"));
    }
    if (address.city) {
        addressToRender.push(createAddressItem("city"));
    }
    if (address.street) {
        addressToRender.push(createAddressItem("street"));
    }
    if (address.house) {
        addressToRender.push(createAddressItem("house"));
    }

    return addressToRender.join(", ");

    function createAddressItem(key) {
        return `${address[key].topoShortName}. ${address[key].topoValue}`;
    }
}

run();
