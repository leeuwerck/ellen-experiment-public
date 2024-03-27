const {
  includes,
  filter,
  find,
  findLast,
  flatten,
  isEqual,
  last,
  nth,
  orderBy,
  pickBy,
  range,
  sampleSize,
  shuffle,
  takeRight,
  takeRightWhile,
  times,
} = _

const stimulus_file_names = [
  "stimulus001.wav",
  "stimulus002.wav",
  "stimulus003.wav",
  "stimulus004.wav",
  "stimulus005.wav",
  "stimulus006.wav",
  "stimulus007.wav",
  "stimulus008.wav",
  "stimulus009.wav",
  "stimulus010.wav",
  "stimulus011.wav",
  "stimulus012.wav",
  "stimulus013.wav",
  "stimulus014.wav",
  "stimulus015.wav",
  "stimulus016.wav",
  "stimulus017.wav",
  "stimulus018.wav",
  "stimulus019.wav",
  "stimulus020.wav",
  "stimulus021.wav",
  "stimulus022.wav",
  "stimulus023.wav",
  "stimulus024.wav",
  "stimulus025.wav",
  "stimulus026.wav",
  "stimulus027.wav",
  "stimulus028.wav",
  "stimulus029.wav",
  "stimulus030.wav",
  "stimulus031.wav",
  "stimulus032.wav",
  "stimulus033.wav",
  "stimulus034.wav",
  "stimulus035.wav",
  "stimulus036.wav",
  "stimulus037.wav",
  "stimulus038.wav",
  "stimulus039.wav",
  "stimulus040.wav",
  "stimulus041.wav",
  "stimulus042.wav",
  "stimulus043.wav",
  "stimulus044.wav",
  "stimulus045.wav",
  "stimulus046.wav",
  "stimulus047.wav",
  "stimulus048.wav",
  "stimulus049.wav",
  "stimulus050.wav",
  "stimulus051.wav",
  "stimulus052.wav",
  "stimulus053.wav",
  "stimulus054.wav",
  "stimulus055.wav",
  "stimulus056.wav",
  "stimulus057.wav",
  "stimulus058.wav",
  "stimulus059.wav",
  "stimulus060.wav",
  "stimulus061.wav",
  "stimulus062.wav",
  "stimulus063.wav",
  "stimulus064.wav",
  "stimulus065.wav",
  "stimulus066.wav",
  "stimulus067.wav",
  "stimulus068.wav",
  "stimulus069.wav",
  "stimulus070.wav",
  "stimulus071.wav",
  "stimulus072.wav",
  "stimulus073.wav",
  "stimulus074.wav",
  "stimulus075.wav",
  "stimulus076.wav",
  "stimulus077.wav",
  "stimulus078.wav",
  "stimulus079.wav",
  "stimulus080.wav",
  "stimulus081.wav",
  "stimulus082.wav",
  "stimulus083.wav",
  "stimulus084.wav",
  "stimulus085.wav",
  "stimulus086.wav",
  "stimulus087.wav",
  "stimulus088.wav",
  "stimulus089.wav",
  "stimulus090.wav",
  "stimulus091.wav",
  "stimulus092.wav",
  "stimulus093.wav",
  "stimulus094.wav",
  "stimulus095.wav",
  "stimulus096.wav",
  "stimulus097.wav",
  "stimulus098.wav",
  "stimulus099.wav",
  "stimulus100.wav",
]

const ba_da_directory = "stimuli_december_2023/ba_da"
const da_ba_directory = "stimuli_december_2023/da_ba"

const ba_da_files = stimulus_file_names.map((n) => `${ba_da_directory}/${n}`)
const da_ba_files = stimulus_file_names.map((n) => `${da_ba_directory}/${n}`)

const filesNames = [...ba_da_files, ...da_ba_files]

filesNames.forEach((filename) => createAudioPlayer(filename, filename))
createAudioPlayer(ba_da_files[0], "reference_ba_stimulus")
createAudioPlayer(da_ba_files[0], "reference_da_stimulus")

const speakerLeft = document.getElementById("speaker_left")
const speakerMiddle = document.getElementById("speaker_middle")
const speakerRight = document.getElementById("speaker_right")

const isTrial = includes(window.location.href.split("#"), "trial")

// non trial value is temporary, needs to be checked by ellen with axelle
const MAX_STEP_COUNT = isTrial ? 3 : 20

const conditions = shuffle([
  { visual: false, referenceSound: "BA" },
  { visual: true, referenceSound: "BA" },
  // { visual: false, referenceSound: "DA" },
  // { visual: true, referenceSound: "DA" },
])

const experimentType = includes(window.location.href.split("#"), "mcgurk")
  ? "mcgurk"
  : "discrimination"

if (!includes(window.location.href.split("#"), "calibration")) {
  const startCalibrationButton = document.getElementById("calibration_button")
  startCalibrationButton.remove()
}

let hasExperimentStarted = false

let seriesNumber
let steps = []
let playing = false

const stimuliIndexRange = [...new Array(100).keys()].map((k) => k + 1)

function playStimuli() {
  document.getElementById("play_button").setAttribute("disabled", "")
  document.getElementById("ready_for_next_series").setAttribute("hidden", "")
  resetImages()

  const nextSoundNumber = getNextSoundNumber()
  addToSteps(nextSoundNumber)

  soundPair = sampleSize([nextSoundNumber, getReferenceSound()], 2)

  const isLeftDumb = soundPair[0] !== getReferenceSound()

  document
    .getElementById("left_stimulus")
    .setAttribute("data-stimulus", soundPair[0])
  setTimeout(() => {
    document
      .getElementById("is_flipped_left")
      .setAttribute(
        "src",
        isLeftDumb ? "dumb_axelle.png" : "axelle_succeed.png"
      )
  }, 800) // timeout is longer than transition of flipping element, which is 0.7 s

  document
    .getElementById("right_stimulus")
    .setAttribute("data-stimulus", soundPair[1])
  setTimeout(() => {
    document
      .getElementById("is_flipped_right")
      .setAttribute(
        "src",
        isLeftDumb ? "axelle_succeed.png" : "dumb_axelle.png"
      )
  }, 800) // timeout is longer than transition of flipping element, which is 0.7 s

  setVideoUp(soundPair, getCurrentCondition().referenceSound)
  setSpeakerImagesUp()

  setTimeout(() => {
    playing = true
    playLeftStimulus(soundPair[0])
  }, 1000)
  setTimeout(() => {
    playReferenceStimulus()
  }, 2500)
  setTimeout(() => {
    playRightStimulus(soundPair[1])
  }, 4000)
  setTimeout(() => {
    showChoiceCues()
    playing = false
  }, 5500)
}

function selectStimulus(stimulus, side) {
  if (
    steps.length === 0 ||
    last(steps).succeeded === true ||
    last(steps).succeeded === false
  )
    return

  hideChoiceCues()

  // success is selecting the sound that is different
  const hasSucceeded = stimulus !== getReferenceSound().toString()

  if (side === "left") {
    const elementToFlip = document.getElementById("left-is-flipping")
    elementToFlip.classList.add("flipping-left")
  } else {
    const elementToFlip = document.getElementById("right-is-flipping")
    elementToFlip.classList.add("flipping-right")
  }

  last(orderBy(steps, "orderBy")).succeeded = hasSucceeded
  last(orderBy(steps, "orderBy")).ISOtimeStamp = new Date().toISOString()

  //  terminate series
  if (
    steps.filter((s) => s.seriesNumber === seriesNumber).length >=
    MAX_STEP_COUNT
  ) {
    if (seriesNumber === conditions.length) {
      hideStimuli()
      document.getElementById("finish_button").removeAttribute("hidden")
    } else {
      showNextSeries()
      hideStimuli()
    }
  } else {
    playing = true
    setTimeout(playStimuli, 2000)
  }

  // document.getElementById("play_button").removeAttribute("disabled") // plays automatically from the selectStimulus function, button no longer needed
  consoleLogStepChart()
}

function playLeftStimulus(soundNumber) {
  speakerLeft.classList.add("visible")
  const player = getPlayer(soundNumber)
  player.onended = () => speakerLeft.classList.remove("visible")
  player.play()
}

function playReferenceStimulus() {
  const soundNumber = getCurrentCondition().referenceSound

  speakerMiddle.classList.add("visible")
  const player = getReferencePlayer(soundNumber)
  player.onended = () => speakerMiddle.classList.remove("visible")
  player.play()
}

function playRightStimulus(soundNumber) {
  speakerRight.classList.add("visible")
  const player = getPlayer(soundNumber)
  player.onended = () => speakerRight.classList.remove("visible")
  player.play()
}

function getReferenceSound() {
  return 1
}

function addToSteps(stimulusNumber) {
  const currentSeriesSteps = steps.filter(
    (step) => step.seriesNumber === seriesNumber
  )
  const stepNumber = currentSeriesSteps.length + 1

  let stepSize
  if (currentSeriesSteps.length === 0) {
    stepSize = 0
  } else {
    stepSize =
      stimulusNumber -
      last(orderBy(currentSeriesSteps, "stepNumber")).stimulusNumber
  }

  steps = [
    ...steps,
    {
      stepNumber,
      stepSize,
      stimulusNumber,
      succeeded: undefined,
      seriesNumber,
      condition: getCurrentCondition().visual ? "audio-visual" : "audio-only",
      referenceSound: getCurrentCondition().referenceSound,
    },
  ]
  localStorage.setItem(`${Date.now()}-steps`, JSON.stringify(steps))
}

function consoleLogStepChart() {
  console.log(
    `${steps
      .map(
        ({ stepSize, stimulusNumber, succeeded }) =>
          `${" ".repeat(stimulusNumber)}▲ ${stepSize} ${
            succeeded ? "succeeded" : "failed"
          }`
      )
      .join("\n")}`
  )
}

function getNextCycleForSucceeded(variation) {
  switch (variation) {
    case +10:
      return -10
    case -10:
      return -10
    case +5:
      return -5
    case -5:
      return -5
    default:
      return -5
  }
}

function getNextCycleForFailed(variation) {
  switch (variation) {
    case -15:
      return +10
    case +10:
      return +10
    case -10:
      return +5
    case -5:
      return +5
    case +5:
      return +5
    default:
      return +5
  }
}

function getCurrentCycleVariation(steps) {
  return findLast(steps, (s) => s.stepSize !== 0)?.stepSize
}

function isCurrentCycleOver(series) {
  return takeRightWhile(series, (step) => step.stepSize === 0).length > 1
}

function getNextSoundNumber() {
  const currentSeriesSteps = orderBy(steps, "stepNumber").filter(
    (s) => s.seriesNumber === seriesNumber
  )
  const lastStep = last(orderBy(currentSeriesSteps, "stepNumber"))
  let stimulusNumber

  if (
    currentSeriesSteps.length === 0 ||
    seriesNumber != lastStep.seriesNumber
  ) {
    stimulusNumber = last(stimuliIndexRange)
    stimulusNumber
  }

  // decrease by 15 if succeeded last step or last stimulus was 100 (ceiling)
  else if (
    lastStep.succeeded &&
    (lastStep.stepSize === -15 ||
      currentSeriesSteps.length === 1 ||
      lastStep.stimulusNumber === 100)
  ) {
    stimulusNumber = lastStep.stimulusNumber - 15
    if (stimulusNumber < 1) stimulusNumber = 1
    return stimulusNumber
  }

  // increase by 10 if failed the 15 step
  else if (!lastStep.succeeded && lastStep.stepSize === -15) {
    stimulusNumber = lastStep.stimulusNumber + 10
  }

  // failed on first try
  else if (!lastStep.succeeded && lastStep.stimulusNumber === 100) {
    stimulusNumber = lastStep.stimulusNumber
  } else if (lastStep.succeeded && isCurrentCycleOver(currentSeriesSteps)) {
    stimulusNumber =
      lastStep.stimulusNumber +
      getNextCycleForSucceeded(getCurrentCycleVariation(currentSeriesSteps))
  } else if (lastStep.succeeded && !isCurrentCycleOver(currentSeriesSteps)) {
    stimulusNumber = lastStep.stimulusNumber
  } else if (!lastStep.succeeded) {
    stimulusNumber =
      lastStep.stimulusNumber +
      getNextCycleForFailed(getCurrentCycleVariation(currentSeriesSteps))
  }

  if (!stimulusNumber) stimulusNumber = 100
  if (stimulusNumber < 1) stimulusNumber = 1
  if (stimulusNumber > 100) stimulusNumber = 100

  return stimulusNumber
}

function createAudioPlayer(filename, id) {
  let audioPlayer = document.createElement("audio")
  audioPlayer.setAttribute("type", "audio-wav")
  audioPlayer.setAttribute("id", id)
  audioPlayer.setAttribute("src", filename)

  document.body.appendChild(audioPlayer)
}

function setVideoUp(soundPair, referenceSound) {
  for (const video of document.getElementsByTagName("video")) {
    video.currentTime = 0
    video.onplay = null
    video.setAttribute("hidden", "")
  }

  if (getCurrentCondition().visual) {
    for (const image of document.getElementsByClassName("BA_video_blurred"))
      image.hidden = true
    for (const video of document.getElementsByClassName(
      getVideoPlayerId(getCurrentCondition().referenceSound)
    )) {
      video.removeAttribute("hidden")
      if (video.className.includes("left_stimulus_class")) {
        getPlayer(soundPair[0]).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
      if (video.className.includes("reference_stimulus_class")) {
        getReferencePlayer(referenceSound).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
      if (video.className.includes("right_stimulus_class")) {
        getPlayer(soundPair[1]).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
    }
  } else {
    for (const image of document.getElementsByClassName("BA_video_blurred"))
      image.removeAttribute("hidden")

    for (const video of document.getElementsByClassName(
      // selector works only for BA condition
      "BA_video_blurred"
    )) {
      video.removeAttribute("hidden")
      if (video.className.includes("left_stimulus_class")) {
        getPlayer(soundPair[0]).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
      if (video.className.includes("reference_stimulus_class")) {
        getReferencePlayer(referenceSound).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
      if (video.className.includes("right_stimulus_class")) {
        getPlayer(soundPair[1]).onplay = function () {
          video.currentTime = 0
          video.play()
        }
      }
    }
  }
}

function setSpeakerImagesUp() {
  speakerLeft.removeAttribute("hidden")
  speakerMiddle.removeAttribute("hidden")
  speakerRight.removeAttribute("hidden")
}

function getVideoPlayerId(referenceSound) {
  return {
    BA: "BA_video",
    DA: "DA_video",
  }[referenceSound]
}

function getPlayer(soundNumber) {
  if (getCurrentCondition().referenceSound === "BA") {
    return document.getElementById(ba_da_files[soundNumber - 1])
  }
  return document.getElementById(da_ba_files[soundNumber - 1])
}

function getReferencePlayer(reference) {
  return document.getElementById(
    reference === "BA" ? "reference_ba_stimulus" : "reference_da_stimulus"
  )
}

function openFullscreen() {
  document.getElementById("fullscreen_button").setAttribute("hidden", "")
  // document.getElementById("fullscreen_button").setAttribute("disabled", "")
  // return
  const elem = document.body
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen()
  }
}

function runSeries() {
  seriesNumber === undefined ? (seriesNumber = 1) : seriesNumber++
  hasExperimentStarted = true
  hideInstructionsAndStartButton()
  switch (experimentType) {
    case "discrimination":
      showStimuli()
      playing = true
      setTimeout(playStimuli, 2000)
      break
    case "mcgurk":
      playMcGurkStimulus()
      break
    default:
      debugger
  }
}

function showInstructionPage() {
  openFullscreen()
  document.getElementById("start_form").setAttribute("hidden", "")
  document.getElementById("start_button").removeAttribute("hidden")
  if (experimentType === "discrimination") {
    document.getElementById("instruction").removeAttribute("hidden")
  }
}

function hideInstructionsAndStartButton() {
  document.getElementById("start_button").setAttribute("hidden", "")
  document.getElementById("instruction").setAttribute("hidden", "")
}

function showStimuli() {
  resetImages()
  setVideoUp([100, 100], "BA") // hardcoded to display the same video as the stimuli that are setup when playStimuli function is called right after
  document.getElementById("stimuli").removeAttribute("hidden")
  // document.getElementById("play_button").removeAttribute("hidden") // plays automatically from the selectStimulus function, button no longer needed
}

function hideStimuli() {
  document.getElementById("stimuli").setAttribute("hidden", "")
  document.getElementById("play_button").setAttribute("hidden", "")
}

function showNextSeries() {
  document.getElementById("start_button").removeAttribute("hidden")
  document.getElementById("ready_for_next_series").removeAttribute("hidden")
}

function resetImages() {
  document
    .getElementsByClassName("flipping-left")[0]
    ?.classList.remove("flipping-left")
  document
    .getElementsByClassName("flipping-right")[0]
    ?.classList.remove("flipping-right")
}

function showChoiceCues() {
  for (const cue of document.getElementsByClassName("cue")) {
    cue.classList.add("visible")
  }
}
function hideChoiceCues() {
  for (const cue of document.getElementsByClassName("cue")) {
    cue.classList.remove("visible")
  }
}

function displayResultAndDownload() {
  delete window.onbeforeunload
  document.exitFullscreen()
  document.getElementById("finish_button").setAttribute("hidden", "")

  let filename_experiment_type
  let responsesToDownload
  if (experimentType === "mcgurk") {
    filename_experiment_type = "mcgurk"
    responsesToDownload = formatMcGurkResponses()
  } else {
    filename_experiment_type = "discrimination"
    responsesToDownload = formatResponses(steps)
  }
  document.getElementById("responses").value = responsesToDownload

  document.getElementById("responses").removeAttribute("hidden")

  subjectId =
    document.getElementsByName("subject_id")[0].value || "missing_subject_id"

  let downloadElement = document.createElement("a")
  downloadElement.setAttribute(
    "href",
    "data:attachment/csv" + "," + encodeURI(responsesToDownload)
  )

  downloadElement.setAttribute(
    "download",
    "responses_" + filename_experiment_type + "_" + subjectId + ".csv"
  )

  downloadElement.style.display = "none"
  document.body.appendChild(downloadElement)

  setTimeout(() => {
    downloadElement.click()
  }, 1000)
}

function formatResponses(response) {
  return `series_number,step_number,stimulus_number,succeeded,condition,reference_sound,iso_timestamp
${response
  .map(
    (r) =>
      `${
        r.seriesNumber +
        "," +
        r.stepNumber +
        "," +
        r.stimulusNumber +
        "," +
        r.succeeded +
        "," +
        r.condition +
        "," +
        r.referenceSound +
        "," +
        r.ISOtimeStamp
      }`
  )
  .join("\n")}
  `
}

function getCurrentCondition() {
  return conditions[seriesNumber - 1]
}

window.onbeforeunload = function () {
  return "Data will be lost if you leave the page, are you sure?"
}

document.addEventListener("keydown", (event) => {
  if (playing || !hasExperimentStarted) return
  if (event.code === "ArrowLeft") {
    document.getElementById("left_stimulus").click()
  } else if (event.code == "ArrowRight") {
    document.getElementById("right_stimulus").click()
  } else if (event.code === "Space") {
    for (const button of document.getElementsByTagName("button")) {
      if (!button.hidden) {
        button.click()
        break
      }
    }
  } else if (experimentType === "mcgurk") {
    if (event.code == "KeyO") {
      document.getElementById("mcgurk_choice_2").classList.add("clicked")
      document.getElementById("mcgurk_choice_2").click()
    } else if (event.code == "KeyI") {
      document.getElementById("mcgurk_choice_1").classList.add("clicked")
      document.getElementById("mcgurk_choice_1").click()
    } else if (event.code == "KeyK") {
      document.getElementById("mcgurk_choice_3").classList.add("clicked")
      document.getElementById("mcgurk_choice_3").click()
    } else if (event.code == "KeyL") {
      document.getElementById("mcgurk_choice_4").classList.add("clicked")
      document.getElementById("mcgurk_choice_4").click()
    }
  }
})

/////// mcgurk

MCGURK_SERIES_LENGTH = 30

const mcGurkBABlurredVideo = document.getElementById("BA_blurred_video_mcgurk")
const mcGurkDABlurredVideo = document.getElementById("DA_blurred_video_mcgurk")
const mcGurKVisualOnlyBaVideo = document.getElementById(
  "BA_visual_only_video_mcgurk"
)
const mcGurKVisualOnlyDaVideo = document.getElementById(
  "DA_visual_only_video_mcgurk"
)
const mcGurKCongruentAudioVisualBaVideo = document.getElementById(
  "congruent_audiovisual_BA_video_mcgurk"
)
const mcGurKCongruentAudioVisualDaVideo = document.getElementById(
  "congruent_audiovisual_DA_video_mcgurk"
)
const mcGurKIncongruentAudioBAVisualDaVideo = document.getElementById(
  "incongruent_audio_BA_visual_DA"
)
const mcGurKIncongruentAudioDAVisualBaVideo = document.getElementById(
  "incongruent_audio_DA_visual_BA"
)

// const mcGurkAxelleImage = document.getElementById("audio_only_image")

let mcGurkStepIndex = 0
let mcGurkAnswers = []

// add condition on range if trial

const playCount = isTrial ? 1 : 5

const mcGurkConditions = shuffle(
  flatten(
    range(playCount).reduce(
      (conditions, _) => [
        ...conditions,
        "audio-only-BA", // each line has to be played 5 times
        "audio-only-DA", // each line has to be played 5 times
        "visual-only-BA", // each line has to be played 5 times
        "visual-only-DA", // each line has to be played 5 times
        "congruent-audio-visual-BA", // each line has to be played 5 times
        "congruent-audio-visual-BA", // each line has to be played 5 times
        "congruent-audio-visual-DA", // each line has to be played 5 times
        "congruent-audio-visual-DA", // each line has to be played 5 times
        // 20 times audio DA visual BA
        "incongruent-audio-DA-visual-BA", // each line has to be played 5 times
        "incongruent-audio-DA-visual-BA", // each line has to be played 5 times
        "incongruent-audio-BA-visual-DA", // each line has to be played 5 times
        "incongruent-audio-BA-visual-DA", // each line has to be played 5 times
      ],
      []
    )
  )
)

function showMcGurkStimuli() {
  document.getElementById("mcgurk_stimuli").removeAttribute("hidden")
  document.getElementById("mcgurk_answers").setAttribute("hidden", "")
}

function playMcGurkStimulus() {
  let player

  switch (mcGurkConditions[mcGurkStepIndex]) {
    case "audio-only-BA":
      player = mcGurkBABlurredVideo
      break
    case "audio-only-DA":
      player = mcGurkDABlurredVideo
      break
    case "visual-only-BA":
      player = mcGurKVisualOnlyBaVideo
      break
    case "visual-only-DA":
      player = mcGurKVisualOnlyDaVideo
      break
    case "congruent-audio-visual-BA":
      player = mcGurKCongruentAudioVisualBaVideo
      break
    case "congruent-audio-visual-DA":
      player = mcGurKCongruentAudioVisualDaVideo
      break
    case "incongruent-audio-DA-visual-BA":
      player = mcGurKIncongruentAudioBAVisualDaVideo
      break
    case "incongruent-audio-BA-visual-DA":
      player = mcGurKIncongruentAudioDAVisualBaVideo
      break

    default:
      debugger
      break
  }
  player.removeAttribute("hidden")
  setTimeout(() => {
    playing = true
    player.play()
  }, 500)
  setTimeout(() => {
    playing = false
    showAnswers()
  }, 2500)
  showMcGurkStimuli()
}

const possibleAnswers = ["BA", "DA", "BDA", "DBA"]
const answerSquares = [
  document.getElementById("mcgurk_choice_1"),
  document.getElementById("mcgurk_choice_2"),
  document.getElementById("mcgurk_choice_3"),
  document.getElementById("mcgurk_choice_4"),
]

function showAnswers() {
  possibleAnswers.map((answer, i) => {
    answerSquares[i].innerHTML = answer
    answerSquares[i].setAttribute("data-answer", answer)
    answerSquares[i].classList.remove("clicked")
  })
  setTimeout(() => {
    document.getElementById("mcgurk_answers").removeAttribute("hidden")
    document.getElementById("mcgurk_stimuli").setAttribute("hidden", "")
    resetStimuli()
  }, 50)
}

function selectAnswer(answer) {
  mcGurkAnswers = [
    ...mcGurkAnswers,
    {
      stepNumber: mcGurkStepIndex + 1,
      stimulus: mcGurkConditions[mcGurkStepIndex],
      response: answer,
      ISOtimestamp: new Date().toISOString(),
    },
  ]

  localStorage.setItem(
    `${Date.now()}-mcgurk-steps`,
    JSON.stringify(mcGurkAnswers)
  )

  if (mcGurkStepIndex === mcGurkConditions.length - 1) {
    document.getElementById("mcgurk_answers").setAttribute("hidden", "")
    return displayResultAndDownload()
  }
  mcGurkStepIndex++

  // break in the middle
  if (mcGurkStepIndex === MCGURK_SERIES_LENGTH) {
    document.getElementById("mcgurk_answers").setAttribute("hidden", "")
    showInstructionPage()
    return
  }
  setTimeout(() => {
    playMcGurkStimulus()
  }, 200)
}

function resetStimuli() {
  mcGurkBABlurredVideo.setAttribute("hidden", "")
  mcGurkBABlurredVideo.currentTime = 0

  mcGurkDABlurredVideo.setAttribute("hidden", "")
  mcGurkDABlurredVideo.currentTime = 0

  mcGurKVisualOnlyBaVideo.setAttribute("hidden", "")
  mcGurKVisualOnlyBaVideo.currentTime = 0

  mcGurKVisualOnlyDaVideo.setAttribute("hidden", "")
  mcGurKVisualOnlyDaVideo.currentTime = 0

  mcGurKCongruentAudioVisualBaVideo.setAttribute("hidden", "")
  mcGurKCongruentAudioVisualBaVideo.currentTime = 0

  mcGurKCongruentAudioVisualDaVideo.setAttribute("hidden", "")
  mcGurKCongruentAudioVisualDaVideo.currentTime = 0

  mcGurKIncongruentAudioBAVisualDaVideo.setAttribute("hidden", "")
  mcGurKIncongruentAudioBAVisualDaVideo.currentTime = 0

  mcGurKIncongruentAudioDAVisualBaVideo.setAttribute("hidden", "")
  mcGurKIncongruentAudioDAVisualBaVideo.currentTime = 0
}

function formatMcGurkResponses() {
  return `step_number,stimulus,response,iso_timestamp
${mcGurkAnswers
  .map(
    (r) =>
      `${
        r.stepNumber +
        "," +
        r.stimulus +
        "," +
        r.response +
        "," +
        r.ISOtimestamp
      }`
  )
  .join("\n")}
  `
}
