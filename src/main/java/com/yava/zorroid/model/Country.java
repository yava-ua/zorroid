package com.yava.zorroid.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@NoArgsConstructor
public class Country {
    private String name;
    private String capital;
    private String region;
    private String subRegion;
    double[] latlng;
}
