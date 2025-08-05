import {setupCache} from "axios-cache-interceptor";
import axios from "axios";

// due to issues with localstorage on Excel for Windows we use in-memory storage (default storage adapter)
export const apiClient = setupCache(axios, {
    interpretHeader: false, // Don't use HTTP cache headers
    methods: ['get'], // Only cache GET requests
    cachePredicate: {
        statusCheck: (status) => status >= 200 && status < 300
    },
    // Needs to be disabled to prevent the pragma header being added by axios
    // read more here: https://axios-cache-interceptor.js.org/config/request-specifics#cache-cachetakeover
    // otherwise this at least fails in excel web, most likely also in other envs
    cacheTakeover: false,
});