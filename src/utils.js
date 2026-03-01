const TAB_NAMES = {
    dashboard: 'Дашборд',
    kanban: 'Проекты',
    finances: 'Финансы',
    clients: 'Клиенты',
    settings: 'Система',
    requests: 'Запросы на удаление',
    tasks: 'Задачи'
};

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(err => console.error('Не удалось скопировать', err));
};

// 5 characters, alphanumeric, case-sensitive. 62^5 = ~916 million combinations.
const generateShortId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


export { TAB_NAMES, useDebounce, copyToClipboard, generateShortId };
