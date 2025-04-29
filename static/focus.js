const API = {
    organizationList: "/orgsList",
    analytics: "/api3/analytics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

async function run() {
    try {
        const orgOgrns = await sendRequest(API.organizationList);
        const ogrns = orgOgrns.join(",");

        const requisites = await sendRequest(`${API.orgReqs}?ogrn=${ogrns}`);
        const orgsMap = reqsToMap(requisites);

        const analytics = await sendRequest(`${API.analytics}?ogrn=${ogrns}`);
        addInOrgsMap(orgsMap, analytics, "analytics");

        const buh = await sendRequest(`${API.buhForms}?ogrn=${ogrns}`);
        addInOrgsMap(orgsMap, buh, "buhForms");

        render(orgsMap, orgOgrns);
    } catch (error) {
        console.error("Ошибка при выполнении запросов:", error);
    }
}

function sendRequest(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка запроса: " + response.status);
            }
            return response.json();
        })
        .catch(error => {
            throw new Error("Ошибка сети или парсинга: " + error.message);
        });
}
