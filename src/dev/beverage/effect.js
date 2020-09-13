var BeverageEffect = {
    alcoholAmount: 0,

    drink: function(name, amount) {
        var TICKS_PER_POWER_UNIT = 6000;
        var beverage = BeverageRegistry.get(name);
        if (beverage && beverage.power) {
            BeverageEffect.alcoholAmount += beverage.power * amount * TICKS_PER_POWER_UNIT;

            var effectPower = parseInt(BeverageEffect.alcoholAmount / 200);
            var effectDuration = BeverageEffect.alcoholAmount * 15;
            if (effectPower > 0) {
                Entity.addEffect(Player.get(), 9, effectPower, effectDuration);    
                Entity.addEffect(Player.get(), 10, effectPower, effectDuration);   
                Entity.addEffect(Player.get(), 5, effectPower, effectDuration);
            }

            return 20;
        }
        return 0;
    }
}

Callback.addCallback("tick", () => {
    if (BeverageEffect.alcoholAmount > 0) {
        BeverageEffect.alcoholAmount--;
    }
});