package com.yava.zorroid.service;

import com.yava.zorroid.model.City;
import com.yava.zorroid.model.Country;
import com.yava.zorroid.model.CountryRegion;
import com.yava.zorroid.utils.Utils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CitiesService {

    @Autowired
    private CountriesService countriesService;

    public List<City> getCities(int quantity, CountryRegion region) {
        List<Country> countriesInRegion = countriesService.getAllCountries()
                .stream()
                .filter(country -> region.getRegionName().equals(country.getRegion()))
                .collect(Collectors.toList());

        return Arrays.stream(Utils.random(countriesInRegion.size(), quantity))
                .mapToObj(countriesInRegion::get)
                .map(Country::getCapital)
                .map(City::new)
                .collect(Collectors.toList());
    }
}
