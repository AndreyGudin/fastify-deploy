import './sprint_game.scss';
import Page from '../../components/templates/page';
import Api from '../../components/api/api';
import Word, { Count, wordProgress } from '../../components/api/types'
import { API_URL } from '../../components/api/types';
import Timer from '../../components/timer/timer';
import human_1 from '../../assets/sprint_human_1.svg'
import human_2 from '../../assets/sprint_human_2.svg'
import human_3 from '../../assets/sprint_human_3.svg'
import After_game_stats from '../../components/after-game-stats/after-game-stats';
import { statistics } from '../../components/api/types';

export type progressOfTheWord = {
  word: Word;
  count: wordProgress;   
}

export default class Sprint_game extends Page {
  private group: number;
  private page: number[];
  private words: Word[];
  private api: Api;
  private correctWords: Word[];
  private wrongWords: Word[];
  private guessedWordsInARow: number;
  private howManyHumansToRender: number;
  private progress: progressOfTheWord[];
  private longestStreak: number;
  private shortStreak: number;

  constructor(id: string, group?: number, page?: number) {
    super(id);
    this.api = new Api(API_URL);
    this.words = [];
    this.correctWords = [];
    this.wrongWords = [];
    this.page = [];
    this.progress = [];
    this.guessedWordsInARow = 0;
    this.howManyHumansToRender = 1;
    this.longestStreak = 0;
    this.shortStreak = 0;

    if(page){
      this.page.push(page);
    } else {
      const rand = Sprint_game.randomIntFromIntervalWithoutRepeat(1,30);
      for (let i = 0; i < 3; i++){
        this.page.push(rand());
      }
    }
    
    if (group) {
      this.group = group;
      (async () => await this.getWords())()
    } else {
      this.group = -1;
    }
  }

  async getWords() {
    this.page.forEach(async page => {
      let temp = await this.api.getWords(page, this.group)
      this.words = this.words.concat(temp);
    })
  }

  randomIntFromInterval(min: number, max: number) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  static randomIntFromIntervalWithoutRepeat(min: number, max: number) {
    const prev: number[] = [];
    return function () {
      let random_number: number;
      do {
        random_number = Math.floor(Math.random() * (max - min + 1) + min);
      } while (!(prev.indexOf(random_number) === -1));
      prev.pop();
      prev.push(random_number);
      return random_number;
    };
  }

  renderChooseGroup(wrapper: HTMLDivElement) {
    const choose_group = this.createDivBlock("choose_group");
    const label = document.createElement("h2");
    label.textContent = "Choose group of words";
    choose_group.append(label);
    const groups = this.createDivBlock("groups_to_choose");
    for (let i = 0; i < 6; i++) {
      const button = document.createElement("button");
      button.textContent = String(i + 1);
      button.id = String(i + 1);
      button.addEventListener("click", async () => {
        choose_group.remove();
        this.group = Number(button.textContent);
        await this.getWords();
        this.renderStartTimer(wrapper);
      });
      groups.append(button);
    }
    choose_group.append(groups);
    wrapper.append(choose_group);
  }

  renderStartTimer(wrapper: HTMLDivElement) {
    const timer = new Timer("div", "timer", 5).render();
    timer.addEventListener("countDown", () => {
      timer.remove();
      this.renderGameWindow(wrapper);
    });
    wrapper.append(timer);
  }

  trackingWord(id: string): number | boolean {
    for (let i = 0; i < this.progress.length; ++i){
      if (this.progress[i].word.id == id){
        return i;
      }
    }
    return false;
  }

  generateСard() {
    if (document.querySelector(".game_window") !== null) {
      let arrayOfWords = [...this.words];
      const indexForWordToChoose = Sprint_game.randomIntFromIntervalWithoutRepeat(0, arrayOfWords.length - 1)
      const fakeOrRealTranslation = Boolean(this.randomIntFromInterval(0, 1));
      const wordToGuess = arrayOfWords[indexForWordToChoose()];
      //Card itself
      const card = this.createDivBlock("card");
      //Word (original)
      const word_original = document.createElement("a");
      word_original.classList.add("original");
      const word_translation = document.createElement("a");
      word_translation.classList.add("translation");
      word_original.textContent = wordToGuess.word;
      //Buttons
      const buttonsWrapper = this.createDivBlock("buttons_wrapper");
      const leftButton = document.createElement("button");
      leftButton.classList.add('wrong')
      const rightButton = document.createElement("button");
      rightButton.classList.add('right')
      leftButton.textContent = "Wrong";
      rightButton.textContent = "Correct";

      // const eventFunction = (e: KeyboardEvent) => {
      //   //console.log(e)
      //   if (e.code === "ArrowRight") {
      //     console.log(e.code);
      //     rightButton.click();
      //   }
      //   if (e.code === "ArrowRight") {
      //     console.log(e.code);
      //     rightButton.click();
      //   }
      // };
      //document.addEventListener("keypress", eventFunction)

      const correctGuess = () => {
        if (this.correctWords.indexOf(wordToGuess) === -1){this.correctWords.push(wordToGuess)}
        document.querySelector(".card")?.remove()
        if(this.guessedWordsInARow !== 3){
          this.guessedWordsInARow++;
        } else {
          this.guessedWordsInARow = 0;
          this.howManyHumansToRender++;
        }

        const tracking = this.trackingWord(wordToGuess.id)
        if (tracking !== false){
          this.progress[tracking as number].count = this.progress[tracking as number].count + 1 as wordProgress;
        } else {
          const temp: progressOfTheWord = {
            word: wordToGuess,
            count: 1,
          }
          this.progress.push(temp);
        }

        this.shortStreak += 1;
        this.longestStreak = this.shortStreak > this.longestStreak ? this.shortStreak : this.longestStreak;
        //document.removeEventListener('keypress', eventFunction)
      }

      const wrongGuess = () => {
        if (this.wrongWords.indexOf(wordToGuess) === -1){this.wrongWords.push(wordToGuess)}
        document.querySelector(".card")?.remove()
        //document.removeEventListener('keypress', eventFunction)
        if(this.guessedWordsInARow !== 0) this.guessedWordsInARow--;

        const tracking = this.trackingWord(wordToGuess.id)
        if (tracking !== false){
          this.progress[tracking as number].count = 0 as wordProgress;
        } else {
          const temp: progressOfTheWord = {
            word: wordToGuess,
            count: 0,
          }
          this.progress.push(temp);
        }
        this.howManyHumansToRender = 1;
        this.longestStreak = this.shortStreak > this.longestStreak ? this.shortStreak : this.longestStreak;
        this.shortStreak = 0;
      }

      if (fakeOrRealTranslation) {//Case when translations match
        word_translation.textContent = wordToGuess.wordTranslate;
        rightButton.addEventListener("click", correctGuess);
        leftButton.addEventListener("click", wrongGuess);
      } else {//Case when translations do not match
        word_translation.textContent = arrayOfWords[indexForWordToChoose()].wordTranslate;
        rightButton.addEventListener("click", wrongGuess);
        leftButton.addEventListener("click", correctGuess);
      }

      //Indicators
      const indicators = this.createDivBlock('indicators');
      for (let i = 0; i < 3; i++){
        const indicator = this.createDivBlock('indicator')
        indicators.append(indicator)
      }
      for (let i = 0; i < this.guessedWordsInARow; i++){
        indicators.children[i].classList.add("active");
      }
      //Adding humans
      const humans = this.createDivBlock('humans');
      switch(this.howManyHumansToRender){
        default:
        case 3:
          humans.innerHTML += `<img src="${human_1}" alt="">`;
        case 2:
          humans.innerHTML += `<img src="${human_2}" alt="">`;
        case 1:
          humans.innerHTML += `<img src="${human_3}" alt="">`;
      }

      buttonsWrapper.append(leftButton, rightButton);
      card.append(indicators, humans, word_original, word_translation, buttonsWrapper);
      return card;
    }
  }

  renderGameWindow(wrapper: HTMLDivElement) {
    const game_window = this.createDivBlock("game_window");
    const TIME_FOR_GAME = 60; //in seconds
    let timer = new Timer("div", "timer", TIME_FOR_GAME).render();

    timer.addEventListener("countDown", async () => {
      game_window.remove();
      const stats = new After_game_stats('div', 'stats', this.correctWords, this.wrongWords)
      wrapper.append(stats.render());
      if (localStorage.user){
        await this.api.saveProgressFromMinigame('sprint', this.progress, this.longestStreak, this.correctWords, this.wrongWords);
        console.log("Statistics after saving: ", await this.api.getUserStatistics());
        // console.log("Learneds words: ", await this.api.getAllUserAggregatedWords())
      }
    });

    game_window.append(timer);
    wrapper.append(game_window);

    setInterval(() => {
      if (document.querySelector(".timer") !== null && !document.querySelector(".card")) {
        game_window.append(this.generateСard()!);
      }
    }, 50);
  }

  render() {
    const wrapper = this.createDivBlock("sprint_wrapper");
    if (this.group === -1) {
      this.renderChooseGroup(wrapper);
    } else {
      this.renderStartTimer(wrapper);
    }

    this.container.append(wrapper);
    return this.container;
  }
}