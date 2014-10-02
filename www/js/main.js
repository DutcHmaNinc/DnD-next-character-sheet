var $sheet, $char, $class = [], $classJson, $classFile, $race, $raceJson, $raceFile, $background, $backgroundJson, $backgroundFile, level, classesList;

// LOAD SHEET AND CHARACTER
$.when(
    $.getJSON("json/sheet.json", function (data) { $sheet = data; }),
    $.getJSON("json/characters/calan.json", function (data) { $char = data; })
).then(function () {

    level = calculateLevel($sheet.sheet.level, $char.character.experience);
    classesList = getLevelperClass($char.character, level);
    $class = loadClasses(classesList);

    $.when(
		$.getJSON('json/races/' + $char.character.race.type + '.json', function (data) { $race = data; }),
		$.getJSON('json/backgrounds/' + $char.character.background.type + '.json', function (data) { $background = data; })
	).then(function () {

	    $sheet ? console.log("Sheet successfully loaded") : console.log("Error in sheet");
	    $char ? console.log("Character successfully loaded") : console.log("Error in character");
	    $class ? console.log("Class successfully loaded") : console.log("Error in class");
	    $race ? console.log("Race successfully loaded") : console.log("Error in race");
	    $background ? console.log("Background successfully loaded") : console.log("Error in background");


	    // START BUILDING SHEET IF ALL FILES ARE LOADED
	    if ($sheet && $char && $class && $race && $background) {

	        // CHARACTER
	        var character = $sheet.sheet.character;
	        character.myChar = $char.character;
	        character.charSheet = $sheet.sheet;
	        character.charRace = $race.charRace;
	        character.charBackground = $background.charBackground;
	        character.classesList = classesList;
	        character.classesData = $class;
	        character.proficiencyBonus = getProficiencyBonus($sheet.sheet.proficiency_bonus, level);
	        character.level = level;

	        // DATA
	        var dataSet = character.charSheet.data_set;
	        dataSet.abilitiesData = fillAbilities(character.charSheet);

	        var data = getData(character, dataSet);

	        skills(data.character, data.dataSet);
	        characterInfo(data.character, data.dataSet);

            // LOGGING
	        console.log("Name: " + data.character.myChar.name);
	        console.log(data.character.classesList);
	        console.log("Level: " + data.character.level);
	        console.log("Proficiency Bonus: " + data.character.proficiencyBonus);
	        console.log(data.dataSet);
	        console.log(data.character);

	    }
	})
});

function getData(character, dataSet) {
    var myRace = character.myChar.race;

    if (myRace.variant) {
        myRace.variant_choises.abilities_increase.forEach(function (ability) {
            dataSet.abilitiesData[ability] += character.charRace.variant.abilities_increase.increase;
        });
        myRace.variant_choises.skills.forEach(function (skill) {
            dataSet.skillsData[skill] = true;
        });
        myRace.variant_choises.feats.forEach(function (feat) {
            dataSet.featsData[feat] = true;
        });
    } else {
        // TODO: If not variant.
    }

    dataSet.languageData = $.merge(character.myChar.race.languages, character.myChar.background.languages);
    character.myChar.level_progression[0].char_class.skills.forEach(function (skill) { dataSet.skillsData[skill] = true });
    character.myChar.background.skills.forEach(function (skill) { dataSet.skillsData[skill] = true });

    return checkLevelsForFeats(character, dataSet);
}

function checkLevelsForFeats(character, dataSet) {
    for (var i = 0; i < character.level ; i++) {
        var myLevel = character.myChar.level_progression[i];
        if (myLevel.feats) {
            dataSet.featsData[myLevel.feats.type] = true;
            if (myLevel.feats.abilities_increase) {
                for (var ability in myLevel.feats.abilities_increase) {
                    dataSet.abilitiesData[ability] += myLevel.feats.abilities_increase[ability].value;
                    if (myLevel.feats.abilities_increase[ability].saving_throw) {
                        dataSet.abilitiesAdjustData[ability] = true;
                    }
                }
            }
        }
    }
    return loadFeats(character, dataSet);
}

function loadFeats(character, dataSet, location) {
    var featAdjustData = dataSet.featAdjustData,
        location = '#feats .list-group';
    for (var feat in dataSet.featsData) {
        $(location).append(
            listWithModalToggle(character.charSheet.feats[feat].name, character.charSheet.feats[feat].description || "empty")
        );
        if (character.charSheet.feats[feat].adjust) {
            var ft = character.charSheet.feats[feat],
                adjust = ft.adjust,
                modifier;

            if (ft.level_progression) {
                for (var i = 0; i < ft.level_progression.length ; i++) {
                    if (ft.level_progression[i] > level) break;
                    modifier = ft.value[i];
                }
            } else {
                modifier = ft.value
            }
            featAdjustData[adjust] = modifier
        }
    }
    showModal($(location + ' > a'));

    return getFeaturesPerClass(character, dataSet);
}

function getFeaturesPerClass(character, dataSet) {
    for (var myClasses in character.classesData) {
        var charClass = character.classesData[myClasses],
            classFeatures = charClass.features,
            appendTo = '#features-' + myClasses + ' .list-group';

        dataSet.featuresData = getFeaturesBasedOnClassLevel(charClass, character.classesList[charClass.type]);
        buildFeaturesList(myClasses, character.classesData);
        for (var feature in dataSet.featuresData) {
            $(appendTo).append(
                listWithModalToggle(classFeatures[feature].name, classFeatures[feature].description || "empty")
            );
            if (classFeatures[feature].adjust) {
                var fa = classFeatures[feature],
                    adjust = fa.adjust,
                    modifier;

                if (fa.level_progression) {
                    for (var i = 0; i < fa.level_progression.length ; i++) {
                        if (fa.level_progression[i] > level) break;
                        modifier = fa.value[i];
                    }
                } else {
                    modifier = fa.value
                }
                dataSet.featureAdjustData[adjust] = modifier
            }
        }
        showModal($(appendTo + ' > a'));
    }
    return getSkillModifierData(character, dataSet);
}

function getSkillModifierData(character, dataSet) {
    dataSet.skillModifierData = abilitiesAndSavingThrows(character, dataSet);
    return returnDataAndCharacter(character, dataSet);
}

// INFO BLOCKS
//
// ------------------------------------ //

function characterInfo(character, dataSet) {
    var cName = character.myChar.name,
        cRace = character.charRace.name,
        cBackground = character.charBackground.name,
        cClass = classesNamed(character.classesList, character.classesData),
        alignment = getAlignment(character.charSheet, character.myChar.alignment.law_chaos, character.myChar.alignment.good_evil),
        level = 0;

    for (var mClass in character.classesList) { level += character.classesList[mClass]; }

    $('#characterName').append('<p>Name: </p><h1>' + cName + '</h1>');

    $('#characterInfo .panel-body').append(
        '<p>' + label('Race: ', cRace) + '<br />' +
        label('Background: ', cBackground) + '<br />' +
        label('Class: ', cClass) + '<br />' +
        label('Level: ', level) + '<br />' +
        label('Alignment: ', alignment) + '</p>');

    var passiveWisdom = 10 + (dataSet.skillModifierData["wisdom"]) + (dataSet.skillsData["perception"] ? character.proficiencyBonus : 0),
        passiveWisdomName = "Passive wisdom",
        passiveIntelligence = 10 + (dataSet.skillModifierData["intelligence"]) + (dataSet.skillsData["investigation"] ? character.proficiencyBonus : 0),
        passiveIntelligenceName = "Passive Intelligence",
        speedTotal = character.charRace.base_speed + (dataSet.featureAdjustData["speed"] || 0) + (dataSet.featAdjustData["speed"] || 0),
        speed = speedTotal + ' feet',
        speedName = "Speed",
        dex = dataSet.skillModifierData["dexterity"],
        initiative = dex == 0 ? dex : '+' + dex,
        initiativeName = "Initiative",
        profBonus = '+' + character.proficiencyBonus;

    $('#stats .list-group').append(
        listWithBadge(profBonus, character.charSheet.proficiency_bonus.name) +
        listWithBadge(initiative, initiativeName) +
        listWithBadge(speed, speedName) +
        listWithBadge(passiveWisdom, passiveWisdomName) +
        listWithBadge(passiveIntelligence, passiveIntelligenceName)
    );
    $('#level .list-group').append(
        listWithBadge((character.myChar.experience + ' xp'), 'Experience Points') +
        listWithBadge(character.level, 'Level')
    );
    for (var mClass in character.classesList) {
        $('#level .list-group').append(
            listWithBadge(character.classesList[mClass], character.classesData[mClass].name + ' levels')
        );
    }
}

function skills(character, dataSet) {
    var sheetSkills = character.charSheet.skills,
        sheetAbilities = character.charSheet.abilities;
    for (var skill in sheetSkills) {
        var onSheet = sheetSkills[skill],
            keyAbility = onSheet.key_ability,
            modifier = dataSet.skillModifierData[keyAbility],
            skilled = !!dataSet.skillsData[skill],
            isSkilled = skilled ? "Yes" : "No",
            bonus = skilled ? character.proficiencyBonus + modifier : modifier;

        $('#skills > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name) +
            tableCell(sheetAbilities[keyAbility].name, 'hidden-xs') +
            tableCell(isSkilled) +
            tableCell((bonus == 0 ? bonus : '+' + bonus)) + '</tr>');
    }
}

function abilitiesAndSavingThrows(character, dataSet) {

    var skillModifierData = [],
        classAbilities = getClassAbilities($class),
        sheetAbilities = character.charSheet.abilities,
        charAbilities = character.myChar.abilities;

    for (var ability in sheetAbilities) {
        var onSheet = sheetAbilities[ability],
            onChar = charAbilities[ability],
            onClass = classAbilities[ability],
            onAdjustData = dataSet.abilitiesAdjustData[ability],
            raceValue = dataSet.abilitiesData[ability] || 0,
            baseValue = onChar.base_value + raceValue,
            tempModifier = onChar.temp_modifier,
            itemModifier = 0,
            endScore = baseValue + tempModifier + itemModifier,
            modifier = Math.floor((endScore - 10) / 2),
            skilled = onClass ? onClass.saving_throw.skilled : onAdjustData ? onAdjustData : onSheet.saving_throw.skilled,
            isSkilled = skilled ? "Yes" : "No",
            savingThrowModifier = skilled ? character.proficiencyBonus + modifier : modifier;

        $('#abilities > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name) +
            tableCell(baseValue) +
            tableCell(tempModifier, 'hidden-xs') +
            tableCell(itemModifier, 'hidden-xs') +
            tableCell(endScore) +
            tableCell((modifier == 0 ? modifier : '+' + modifier)) + '</tr>');

        $('#savingThrows > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name, 'hidden-lg') +
            tableCell(isSkilled) +
            tableCell((savingThrowModifier == 0 ? savingThrowModifier : '+' + savingThrowModifier)) + '</tr>');

        skillModifierData[ability] = modifier;
    }

    return skillModifierData;
}