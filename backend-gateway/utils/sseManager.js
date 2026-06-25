// SSE Client connection pool
const clients = new Map(); // userId -> Set of res objects

export const addSSEClient = (userId, res) => {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }
    clients.get(userId).add(res);

    req_close_handler(userId, res);
};

const req_close_handler = (userId, res) => {
    res.on("close", () => {
        const userClients = clients.get(userId);
        if (userClients) {
            userClients.delete(res);
            if (userClients.size === 0) {
                clients.delete(userId);
            }
        }
    });
};

export const broadcastEvent = (userId, eventType, payload) => {
    const userClients = clients.get(userId);
    if (userClients) {
        const dataStr = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
        for (const res of userClients) {
            try {
                res.write(`event: ${eventType}\n`);
                res.write(`data: ${dataStr}\n\n`);
            } catch (err) {
                console.error(`Error sending SSE to user ${userId}:`, err);
            }
        }
    }
};

export const broadcastGlobalEvent = (eventType, payload) => {
    const dataStr = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
    for (const [_, userClients] of clients) {
        for (const res of userClients) {
            try {
                res.write(`event: ${eventType}\n`);
                res.write(`data: ${dataStr}\n\n`);
            } catch (err) {}
        }
    }
};
