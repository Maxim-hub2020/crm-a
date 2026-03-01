const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});

admin.initializeApp();

const db = admin.firestore();
const MAX_API_URL = "https://platform-api.max.ru";

exports.sendMessageToMax = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated", 
            "Вы должны быть авторизованы для отправки сообщений."
        );
    }

    const { chatId, text, adminId } = data;

    if (!chatId || !text || !adminId) {
         throw new functions.https.HttpsError(
            "invalid-argument", 
            "Необходимо указать ID чата, текст сообщения и ID администратора."
        );
    }

    let apiToken;
    try {
        // 2. Fetch API Token from Firestore
        const settingsRef = db.doc(`artifacts/pro-crm-ultimate-app/users/${adminId}/settings/integrations`);
        const docSnap = await settingsRef.get();

        if (!docSnap.exists() || !docSnap.data().maxApiToken) {
             throw new functions.https.HttpsError('not-found', 'Токен API MAX не найден в настройках.');
        }
        apiToken = docSnap.data().maxApiToken;

    } catch (error) {
        console.error("Ошибка получения токена:", error);
        throw new functions.https.HttpsError("internal", "Не удалось получить токен для интеграции.");
    }

    // 3. Send Message via MAX API
    try {
        const response = await axios.post(`${MAX_API_URL}/messages`, 
            {
                to: chatId, // Assuming 'chatId' is the recipient identifier
                text: text,
                format: "markdown"
            }, 
            {
                headers: {
                    "Authorization": `${apiToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Сообщение успешно отправлено в MAX:", response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error("Ошибка при отправке сообщения в MAX:", error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data.message : "Внутренняя ошибка сервера";

        throw new functions.https.HttpsError('unknown', `Ошибка API MAX (${status}): ${message}`);
    }
});

// New function to calculate project profitability
exports.calculateProjectProfitability = functions.firestore
    .document('projects/{projectId}/{collection}/{docId}')
    .onWrite(async (change, context) => {
        const { projectId, collection } = context.params;

        // We only care about incomes and expenses
        if (collection !== 'incomes' && collection !== 'expenses') {
            return null;
        }

        const projectRef = db.collection('projects').doc(projectId);

        // Get all incomes and expenses for the project
        const incomesSnapshot = await projectRef.collection('incomes').get();
        const expensesSnapshot = await projectRef.collection('expenses').get();

        let totalIncome = 0;
        incomesSnapshot.forEach(doc => {
            totalIncome += doc.data().amount;
        });

        let totalExpense = 0;
        expensesSnapshot.forEach(doc => {
            totalExpense += doc.data().amount;
        });
        
        // Calculate profitability
        const profitability = totalIncome > 0 
            ? ((totalIncome - totalExpense) / totalIncome) * 100 
            : 0;

        // Update the project document
        return projectRef.update({
            totalIncome,
            totalExpense,
            profitability
        });
    });
