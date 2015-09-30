# Dota2-Custom-IHL
Create and customize your very own Dota 2 in house league with ease. Features include automatic match creation, an easily configurable web based match creator and more.


## Getting Started
### Use notes
Don't use this for anything ~~serious~~. Don't even try. The way it is now, this thing doesn't even run properly. You'd be lucky to get a single match going. Ok, you could probably get a few matches going, they just wouldn't be going the way you expected. Who knows what would happen really. It's not like we test this thing.

### Development
Alright boys this is it. To get started on the project all you have to do is clone/fork it and run npm install in the root directory. Everything _should_ work after that. If you're missing a dependency after that just install it and tell me and I'll add it to package.json (or you can even do it yourself since you have commit permissions).

## Developemnt Roadmap

Alright so here's the plan:
--* Finish the frontend. That includes the logical side of it too. Make sure no one can messup a lobby by spamming it with requests. Thing's like that.
--* Make sure the scheduler behaves as intended. Basically make sure that multiple bots can run at the same time without a hitch and make sure that when they are done, they return to the pool of useable bots and are acutally used again.
--* Create/utilize a match parser. We don't actually have to create one if we use Clarity (which is written in Java I believe). The YASP guys told me that a Javascript based match parser isn't even worth it, which is why they don't even use one. I'd be interested to see performance comparissons though. Honestly, what parser to use is *very* low on the priority list. We just need *a* parser, doesn't matter which to the users.
---- For a recap: 
------* Clarity
------* Our own match parser in Javascript
------* Our own match parser written in some other language