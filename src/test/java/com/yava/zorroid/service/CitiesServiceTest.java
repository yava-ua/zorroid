package com.yava.zorroid.service;

import com.yava.zorroid.main.ZorroidConfig;
import com.yava.zorroid.model.City;
import com.yava.zorroid.model.CountryRegion;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;

import static org.junit.Assert.*;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ZorroidConfig.class)
public class CitiesServiceTest {

    @Autowired
    private CitiesService citiesService;

    @Test
    public void getCities(int quantity, CountryRegion region) throws Exception {
        final List<City> cities = citiesService.getCities(quantity, region);
        cities.stream()
                .map(City::getName)
                .forEach(log::debug);
    }

}