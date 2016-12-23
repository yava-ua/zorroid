package com.yava.zorroid.google.api.staticmaps;

import com.yava.zorroid.google.api.ApiRequestParams;

import java.awt.*;

public class StaticMapsApiRequestParams extends ApiRequestParams {

    @Override
    public void validate() {
        if (!params.containsKey("center") && !params.containsKey("markers")) {
            throw new IllegalArgumentException("ApiRequestParams must contain 'center' or 'markers'");
        }

        if (!params.containsKey("zoom") && !params.containsKey("markers")) {
            throw new IllegalArgumentException("ApiRequestParams must contain 'zoom' or 'markers'");
        }

        if (!params.containsKey("size")) {
            throw new IllegalArgumentException("ApiRequestParams must contain 'size'");
        }
    }

    public enum ImageFormat {
        PNG, GIF, JPEG
    }

    public enum MapType {
        roadmap, satellite, hybrid, terrain
    }

    public StaticMapsApiRequestParams center(String center) {
        params.put("center", center);
        return this;
    }

    public StaticMapsApiRequestParams zoom(int zoom) {
        params.put("zoom", String.valueOf(zoom));
        return this;
    }

    public StaticMapsApiRequestParams size(Dimension dimension) {
        params.put("size", (int) dimension.getWidth() + "x" + (int) dimension.getHeight());
        return this;
    }

    public StaticMapsApiRequestParams scale(int scale) {
        params.put("scale", String.valueOf(scale));
        return this;
    }

    public StaticMapsApiRequestParams format(ImageFormat format) {
        params.put("format", format.name());
        return this;
    }

    public StaticMapsApiRequestParams mapType(MapType mapType) {
        params.put("maptype", mapType.name());
        return this;
    }

    public StaticMapsApiRequestParams language(String language) {
        params.put("language", language);
        return this;
    }

    public StaticMapsApiRequestParams region(String region) {
        params.put("region", region);
        return this;
    }

    public StaticMapsApiRequestParams markers(String markers) {
        params.put("markers", markers);
        return this;
    }

    public StaticMapsApiRequestParams path(String path) {
        params.put("path", path);
        return this;
    }

    public StaticMapsApiRequestParams visible(String visible) {
        params.put("visible", visible);
        return this;
    }

    public StaticMapsApiRequestParams style(String style) {
        params.put("style", style);
        return this;
    }

}
