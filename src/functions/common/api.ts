import {buildWebStorage, setupCache} from "axios-cache-interceptor";
import axios from "axios";

export const apiClient = setupCache(axios, {
    storage: buildWebStorage(localStorage, 'glassnode-cache:'),
    interpretHeader: false, // Don't use HTTP cache headers
    methods: ['get'], // Only cache GET requests
    cachePredicate: {
        statusCheck: (status) => status >= 200 && status < 300
    }
});