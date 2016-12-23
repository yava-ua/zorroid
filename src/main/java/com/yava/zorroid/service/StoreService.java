package com.yava.zorroid.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;

@Service
public class StoreService {
    public void storeImage(byte[] bytes) throws IOException {
        ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(bytes);
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
        File outFile = new File("image.png");
        ImageIO.write(img, "png", outFile);
    }
}
