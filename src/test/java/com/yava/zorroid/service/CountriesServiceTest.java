package com.yava.zorroid.service;

import com.yava.zorroid.main.ZorroidConfig;
import com.yava.zorroid.model.Country;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ZorroidConfig.class)
public class CountriesServiceTest {

    @Autowired
    private CountriesService countriesService;

    @Test
    public void getCountries() throws Exception {
        final List<Country> allCountries = countriesService.getAllCountries();
        allCountries.forEach(country -> {
            log.debug("Country {} has capital {}", country.getName(), country.getCapital());
        });
    }
}