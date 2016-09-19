package com.yava.zorroid.endpoint;

import com.yava.zorroid.model.TestModel;
import com.yava.zorroid.service.MapsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.awt.*;

@RestController
@RequestMapping("/api")
@Slf4j
public class TestController {

    @Autowired
    private MapsService mapsService;

    @RequestMapping("/test/{name}")
    public TestModel sayHi(@PathVariable String name) {
        return new TestModel("Hi, " + name);
    }


    @RequestMapping(value = "/test/image", method = RequestMethod.GET, produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] getMap() throws Exception {
        log.debug("Image requested");
        return mapsService.getMapsImage("Kyiv", 12, new Dimension(800, 600));
    }

}
