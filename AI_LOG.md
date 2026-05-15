read whole repo to get context
**
lets update the range of values for the slider. i say we take the max value of the cars returned, and set the upper bound to that
**
lets add rules for calculating the price on both the client and server (looks like api endpoint getQuote), lets create a shared util for these rules that can be used for both applications, and easily extendable with additional rules. the rules:

- A reservation that includes a holiday but does not start or end on that holiday should receive a 17% discount off the total price. (A list of fictitious holidays is included below.)
- A reservation for more than 3 days should receive a $10/hr discount on the hourly rate.
- These discounts cannot both apply at the same time. If they conflict, the discount with the best price applies to the reservation.
- Visitors should see the discount reflected during search and checkout, including on the review page.

product reqs:

- lets have a banner on the search page, where we show the discount they would be getting
- lets also have a small banner on the checkout page with the same
- and obv have the correct price reflected on getQuote endpoint given the dates and outlined rules
