package com.yava.zorroid;

import com.yava.zorroid.main.ZorroidConfig;
import com.yava.zorroid.model.City;
import com.yava.zorroid.model.CountryRegion;
import com.yava.zorroid.service.CitiesService;
import com.yava.zorroid.service.MapsService;
import com.yava.zorroid.service.StoreService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.awt.Dimension;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(classes = ZorroidConfig.class)
public class MainTest {

    @Autowired
    private CitiesService citiesService;

    @Autowired
    private MapsService mapsService;

    @Autowired
    private StoreService storeService;

    @Test
    public void getMapWithCities() throws Exception {
        List<String> cityNames = citiesService.getCities(8, CountryRegion.Europe)
                .stream()
                .map(City::getName)
                .collect(Collectors.toList());

        final byte[] mapsImageWithMarkers = mapsService.getMapsImageWithMarkers(cityNames, new Dimension(800, 400));
        storeService.storeImage(mapsImageWithMarkers);
    }
}
