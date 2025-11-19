// /policies/scripts/service-chaining.js
var userProfile = context.getVariable("user_profile_response.content");
var userId = JSON.parse(userProfile).id;

// Chain to get user orders
context.setVariable("servicecallout.orders.request.path", "/orders?user_id=" + userId);

// Chain to get user preferences  
context.setVariable("servicecallout.preferences.request.path", "/preferences/" + userId);

// Aggregate responses
var orders = context.getVariable("orders_response.content");
var preferences = context.getVariable("preferences_response.content");

var aggregatedResponse = {
    user: JSON.parse(userProfile),
    orders: JSON.parse(orders),
    preferences: JSON.parse(preferences)
};

context.setVariable("response.content", JSON.stringify(aggregatedResponse));