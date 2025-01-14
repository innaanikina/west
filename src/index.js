import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        let first_string  = getCreatureDescription(this);
        let second_string = super.getDescriptions();
        return [first_string, second_string];
    }
}



// Основа для утки.
class Duck extends Creature {
    constructor(name="Мирный житель", maxPower=2, image) {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    };

    swims() {
        console.log('float: both;');
    };

}

class Gatling extends Creature {
    constructor(name="Гатлинг", maxPower=6, image) {
        super(name, maxPower, image);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        let opponentCards = oppositePlayer.table;
        taskQueue.push(onDone => this.view.showAttack(onDone));

        for(let pos = 0; pos < opponentCards.length; pos++) {
            taskQueue.push(onDone => {
                const card = opponentCards[pos];
                if (card) {
                    this.dealDamageToCreature(this.currentPower, card, gameContext, onDone);
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}


class Dog extends Creature {
    constructor(name="Собака", maxPower=3, image) {
        super(name, maxPower, image);
    }
}

class Trasher extends Dog {
    constructor(name="Громила", maxPower=5, image) {
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation){
        continuation(value - 1);
        this.view.signalAbility(() => {
            if (value > 1) {
                this.view.signalDamage()
            }
        });
    }

    getDescriptions() {
        let description = super.getDescriptions();
        return ["Получает на 1 меньше урона\n"].concat(description);
    }
}

class Lad extends Dog{
    constructor(name="Браток", maxPower=2, image) {
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const damage = value - Lad.getBonus();
        continuation(damage);
        this.view.signalAbility(() => {
            if (damage > 0) {
                this.view.signalDamage()
            }
        });
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation){
        continuation(value + Lad.getBonus());
    }

    static getBonus(){
       return  this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        continuation();
        let curLadsCount = Lad.getInGameCount();
        Lad.setInGameCount(curLadsCount + 1);
    }

    doBeforeRemoving(continuation) {
        continuation();
        let curLadsCount = Lad.getInGameCount();
        Lad.setInGameCount(curLadsCount)
    }

    getDescriptions() {
        let description = super.getDescriptions();
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')){
            return ["Чем больше их, тем они сильнее\n\n"].concat(description);
        }
        return description;
    }

}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
