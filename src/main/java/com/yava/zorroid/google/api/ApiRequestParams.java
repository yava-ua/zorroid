package com.yava.zorroid.google.api;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public abstract class ApiRequestParams {
    protected Map<String, String> params = new HashMap<>();

    public abstract void validate();

    public String get() {
        return params.entrySet()
                .stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
    }
}
