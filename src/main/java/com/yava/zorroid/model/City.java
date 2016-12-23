package com.yava.zorroid.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class City {
    private String name;

    public City(String name) {
        this.name = name;
    }
}
