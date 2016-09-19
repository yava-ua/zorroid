package com.yava.zorroid.service;

import com.yava.zorroid.google.api.ApiRequestBuilder;
import com.yava.zorroid.google.api.ApiRequestParams;
import com.yava.zorroid.google.api.staticmaps.StaticMapsApiRequestParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.awt.Dimension;

@Service
public class MapsService {

    @Autowired
    private ApiRequestBuilder apiRequestBuilder;

    private RestTemplate restTemplate = new RestTemplate();

    public byte[] getMapsImage(String center, int zoom, Dimension dimension) throws Exception {
        ApiRequestParams staticMapsApiRequestParams = new StaticMapsApiRequestParams()
                .center(center)
                .zoom(zoom)
                .size(dimension)
                .language("ua");

        HttpHeaders headers = new HttpHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(apiRequestBuilder.build(staticMapsApiRequestParams), HttpMethod.GET, entity, byte[].class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        }
        throw new Exception(response.getStatusCode().toString());
    }

}
