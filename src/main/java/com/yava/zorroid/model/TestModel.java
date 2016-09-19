package com.yava.zorroid.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TestModel {

    private String message;

    public TestModel(String message) {
        this.message = message;
    }
}
