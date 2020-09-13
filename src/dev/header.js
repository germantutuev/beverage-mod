Item.registerNameOverrideFunctionForID = (id, func) => {
    Item.nameOverrideFunctions[id] = func;
    Item.setItemNameOverrideCallbackForced(id, true);
}

function preventItemSpending(item) {
    if (Game.isItemSpendingAllowed()) {
        item.count++;
    }
}