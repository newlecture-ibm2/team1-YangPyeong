# Build stage - Gradle 8.10 + JDK 21
FROM gradle:8.10-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon -x test

# Run stage - JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
