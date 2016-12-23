package com.yava.zorroid.google.api;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ApiRequestBuilder {
    @Value("${google.maps.baseUrl}")
    private String baseUrl;

    @Value("${google.maps.endpoint.staticmaps}")
    private String staticMaps;

    @Value("${google.maps.token}")
    private String key;

    public String build(ApiRequestParams apiRequestParams) {
        apiRequestParams.validate();
        String result = baseUrl + staticMaps + "?" + apiRequestParams.get() + "k&ey=" + key;
        log.debug("ApiRequestParams url: {}", result);
        return result;
    }
}
