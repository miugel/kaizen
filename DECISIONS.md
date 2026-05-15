## Part 1

The slider is not allowing users to set a max budget higher than $99 essentially. If the slider is all the way to right, the upper boundary is unlimited. The fix here is to either replace the slider with inputs and allow users to set a number value as the max, or expand the range of the slider. To keep it simple, I will go ahead and update the range for the slider.

# Part 3

1. What you changed and why

I started a test suite for the discount logic. I imagine we will be adding more discount rules in the near future, so adding these tests now will make sure that nothing breaks or the discounts are being applied correctly.

When creating the discount feature, I already had extensibility in mind so I created a file to abstract all of the discount business logic away from the components, keeping the components "dumb".

2. What you'd do differently if you weren't time-boxed

If I weren't time boxed, I would look at revamping the UX including updating the UI and looking at creating a better selecting dates/filter experience. I might have a landing page where the user selects filters and dates, along with maybe some AI suggested car rental deals taking in some input like past cars rented for example.

I would also improve test coverage and build a more robust test suite out including unit tests, end to end tests, and visual regression tests to ensure the health of our app and make sure changes introduced do not cause incidents.

Lastly, I would implement observability/experimentation config. This would also help with ensuring the health of our app, but also act as insight into how users are interacting with our app and where the gaps in our flow are. This analytics data can then be used to fuel future product decisions and roadmap. Implementing an experiment service would also help us quickly run tests and deliver versions of features to different users to see what they are getting more value out of, continuing this trend of data-driven decisions.

# Bonus

In terms of the UX, I would add a landing page and improve the date selection/filter flow. As it stands, the user is overwhelmed with information as soon as they visit the crowded app. Adding a landing page would abstract the date and filter decision making away from the bloated user interface and make for a better user experience. More specifically, I would also update the filter experience. For example, if you select a start date that is greater than your end date, the end date should ideally update or there should be a concept of null states. I think small things like that matter for a very pleasant user experience.
