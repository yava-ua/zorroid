package com.yava.zorroid.model;

public enum CountryRegion {
    Europe("Europe");

    private String regionName;

    CountryRegion(String regionName) {
        this.regionName = regionName;
    }

    public String getRegionName() {
        return regionName;
    }
}
