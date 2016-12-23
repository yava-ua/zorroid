package com.yava.zorroid.endpoint;

import com.yava.zorroid.main.ZorroidConfig;
import com.yava.zorroid.model.TestModel;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = ZorroidConfig.class)
public class TestControllerTest {

    @Autowired
    private TestRestTemplate testRestTemplate;

    @Test
    public void sayHi() throws Exception {
        TestModel model = this.testRestTemplate.getForObject("/api/test/John", TestModel.class);
        assertEquals("Test entity match", "Hi, John", model.getMessage());
    }

}