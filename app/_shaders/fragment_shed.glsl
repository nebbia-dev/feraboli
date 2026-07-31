uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    float repUvX = vUv.x * 5.0;
    float availableHeight = mix(0.5, 1.0, vUv.x);
    float compressedUvY = clamp(vUv.y / availableHeight, 0.0, 1.0);
    vec4 texture = texture2D(
        uTexture,
        vec2(repUvX, compressedUvY)
    );

    gl_FragColor = texture;
}
