import {HttpQuery} from "../../@types";

export default (map: {[key: string]: any}): HttpQuery => {
    return (url: string, query?: {[key: string]: string | number | Date | null}) => {
        return Promise.resolve(map[url])
    }
}
