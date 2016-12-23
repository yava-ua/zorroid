package com.yava.zorroid.service;

import com.yava.zorroid.google.api.ApiRequestBuilder;
import com.yava.zorroid.google.api.ApiRequestParams;
import com.yava.zorroid.google.api.staticmaps.StaticMapsApiRequestParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.awt.Dimension;
import java.net.URLEncoder;
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
public class MapsService {

    @Autowired
    private ApiRequestBuilder apiRequestBuilder;

    private RestTemplate restTemplate = new RestTemplate();

    private byte[] getImage(ApiRequestParams staticMapsApiRequestParams) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(apiRequestBuilder.build(staticMapsApiRequestParams), HttpMethod.GET, entity, byte[].class);

        if (response.getStatusCode() == HttpStatus.OK) {
            return response.getBody();
        }
        throw new Exception(response.getStatusCode().toString());
    }


    public byte[] getMapsImage(String center, int zoom, Dimension dimension) throws Exception {
        ApiRequestParams apiRequestParams = new StaticMapsApiRequestParams()
                .center(center)
                .zoom(zoom)
                .size(dimension)
                .language("ua");
        return getImage(apiRequestParams);
    }

    public byte[] getMapsImageWithMarkers(List<String> markers, Dimension dimension) throws Exception {
        ApiRequestParams apiRequestParams = new StaticMapsApiRequestParams()
                .markers(markers.stream().collect(Collectors.joining("|")))
                .language("ua")
                .size(dimension);
        return getImage(apiRequestParams);
    }

}
