package com.yava.zorroid.service;

import com.yava.zorroid.model.Country;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class CountriesService {

    private String endpoint = "https://restcountries.eu/rest/v1/";

    private RestTemplate restTemplate = new RestTemplate();

    private List<Country> countries;

    private List<Country> fetchCountries() {
        HttpHeaders headers = new HttpHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<List<Country>> response = restTemplate.exchange(endpoint + "all", HttpMethod.GET, null, new ParameterizedTypeReference<List<Country>>() {
        });

        return response.getBody();
    }

    public List<Country> getAllCountries() {
        if (countries == null) {
            countries = fetchCountries();
        }
        return countries;
    }
}
