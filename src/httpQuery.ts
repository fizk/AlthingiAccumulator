import http from "http";

export default (config: {host: string, port: number | string}) => {
    return (url: string, query: {[key: string]: string | number | Date | null} = {}): Promise<{[key: string]: any}> => {
        return new Promise((resolve, reject) => {

            // Turn an Object into a HTTP query string
            const queryMap = Object.entries(query).map(([key, value]) => {
                if(value instanceof Date) {
                    return {key, value: encodeURIComponent(value.toJSON())};
                } else {
                    return {key, value: encodeURIComponent(String(value))};
                }
            }).map(({key, value}) => `${key}=${value}`).join('&');

            const options = {
                hostname: config.host,
                port: config.port,
                path: Object.entries(query).length === 0 ? url : `${url}?${queryMap}`,
                method: 'GET',
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                }
            };
            let rawData = '';

            // Make a HTTP request.
            const req = http.request(options, (res) => {
                if ((res.statusCode || 0) > 299) {
                    reject(new Error(`URL: ${url}, StatusCode: ${res.statusCode}`))
                }
                res.setEncoding('utf8');
                res.on('data', (chunk) => rawData += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(rawData))
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error(`Timout ${url} ${JSON.stringify(query)}`)));
            req.end();
        });
    };
}
