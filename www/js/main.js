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

	    // LOG ALL DATA 
	    $sheet ? console.log("Sheet successfully loaded") : console.log("Error in sheet");
	    $char ? console.log("Character successfully loaded") : console.log("Error in character");
	    $class ? console.log("Class successfully loaded") : console.log("Error in class");
	    $race ? console.log("Race successfully loaded") : console.log("Error in race");
	    $background ? console.log("Background successfully loaded") : console.log("Error in background");


	    // START BUILDING SHEET IF ALL FILES ARE LOADED
	    if ($sheet && $char && $class && $race && $background) {

	        var myChar = $char.character,
                charSheet = $sheet.sheet,
                charRace = $race.charRace,
                charBackground = $background.charBackground,
                proficiencyBonus = getProficiencyBonus(charSheet.proficiency_bonus, level),
                // DATA STORAGE
                skillsData = [],
                skillModifierData = [],
                abilitiesData = [],
                featuresData = [],
                featureAdjustData = [],
                featsData = [],
                featAdjustData = [];

	        // RACE DATA
	        var myRace = myChar.race;

	        if (myRace.variant) {
	            myRace.variant_choises.abilities_increase.forEach(function (ability) {
	                abilitiesData[ability] = charRace.variant.abilities_increase.increase
	            });
	            myRace.variant_choises.skills.forEach(function (skill) {
	                skillsData[skill] = true
	            });
	            myRace.variant_choises.feats.forEach(function (feat) {
	                featsData[feat] = true
	            });
	            // TODO: languages
	            console.log(abilitiesData);
	        } else {
	            // TODO: If not variant.
	        }
	        // CLASS AND BACKGROUND SKILLS
	        myChar.level_progression[0].char_class.skills.forEach(function (skill) { skillsData[skill] = true });
	        myChar.background.skills.forEach(function (skill) { skillsData[skill] = true });
	        console.log(skillsData);
	        console.log(featsData);
	        // LOAD FEAT AND RETURN IF THEY ADJUST ANYTHING
	        featAdjustData = loadFeats(featsData, charSheet, '#feats .list-group')
	        // FEATURES PER CLASS
	        for (var myClasses in $class) {
	            var charClass = $class[myClasses].charClass;
	            featuresData = getFeaturesBasedOnClassLevel(charClass, classesList[charClass.type]);
	            featureAdjustData = addActiveFeaturesToList(charClass, featuresData, classesList[myClasses], '#features .list-group');
	        }
	        // ABILITIES AND SAVING THROWS
	        var sheetAbilities = charSheet.abilities,
                charAbilities = myChar.abilities,
                classAbilities = getClassAbilities($class);
	        skillModifierData = abilitiesAndSavingThrows(sheetAbilities, charAbilities, classAbilities, abilitiesData, proficiencyBonus);
	        // SKILLS
	        skills(charSheet.skills, skillsData, skillModifierData, sheetAbilities, proficiencyBonus);
            // CHARACTER INFO
	        characterInfo(myChar, charSheet, charRace, charBackground, $class, classesList, skillsData, skillModifierData, featAdjustData, featureAdjustData, proficiencyBonus);
	    }
	})
});



function tableCell(value, hidden) {
    if (hidden) {
        return '<td class="hidden-xs"><span>' + value + '</span></td>'
    } else {
        return '<td><span>' + value + '</span></td>';
    }
}

function label(name, info) {
    return '<span>' + name + '</span><strong>' + info + '</strong>';
}

function listNoBadge(value) {
    return '<li class="list-group-item">' + value + '</li>';
}

function listWithBadge(key, value) {
    return '<li class="list-group-item"><span class="badge">' + key + '</span>' + value + '</li>';
}

function listWithModalToggle(name, description) {
    return '<a href="javascript:void(0)" class="list-group-item" data-description="' + description + '">' + name + '</a>';
}

function showModal($object) {
    $object.on('click', function () {
        var clicked = $(this);
        $('#descriptionModal .modal-header h4').html(clicked.html());
        $('#descriptionModal .modal-body').html(clicked.data('description'));
        $('#descriptionModal').modal();
    });
}

function calculateLevel(xpList, xp) {
    var level;
    for (var i = 0; i < xpList.length ; i++) {
        if (xpList[i] > xp) break;
        level = i + 1;
    }
    console.log("Level: " + level);

    return level;
}

function getLevelperClass(myChar, level) {
    var classesList = [];
    for (var i = 0; i < level ; i++) {
        classesList[myChar.level_progression[i].char_class.type] ? classesList[myChar.level_progression[i].char_class.type] += 1 : classesList[myChar.level_progression[i].char_class.type] = 1
    }
    console.log(classesList);

    return classesList;
}

function getFeaturesBasedOnClassLevel(charClass, level) {
    var classFeatures = charClass.features,
        featuresData = [];
    for (var feature in classFeatures) {
        classFeatures[feature].level <= level ? featuresData[feature] = true : "";
    }
    console.log(featuresData);

    return featuresData;
}

function addActiveFeaturesToList(charClass, featuresData, level, appendTo) {
    var classFeatures = charClass.features,
        featureAdjustData = [];

    for (var feature in featuresData) {
        $(appendTo).append(
            listWithModalToggle(classFeatures[feature].name, classFeatures[feature].description || "empty")
        );

        // LOOK FOR FEATURE STAT ADJUSTMENT
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
            featureAdjustData[adjust] = modifier
        }
    }
    showModal($(appendTo + ' > a'));
    console.log(featureAdjustData);

    return featureAdjustData;
}

function getProficiencyBonus(sheetPB, level) {
    var lvlProgPB = sheetPB.level_progression,
		valuePB = sheetPB.value,
        proficiencyBonus;
    for (var i = 0; i < lvlProgPB.length ; i++) {
        if (lvlProgPB[i] > level) break;
        proficiencyBonus = valuePB[i];
    }
    console.log("Proficiency Bonus: " + proficiencyBonus);

    return proficiencyBonus;
}

function loadClasses(classesList) {
    var $class = {};
    for (var myClasses in classesList) { 
        $.ajax({
            type: 'GET',
            url: 'json/classes/' + myClasses + '.json',
            dataType: 'json',
            success:  function (data) { $class[myClasses] = data; },
            data: {},
            async: false
        });
    }
    return $class;
}

function loadFeats(featsData, charSheet, location) {
    var featAdjustData = [];
    for (var feat in featsData) {
        $(location).append(
            listWithModalToggle(charSheet.feats[feat].name, charSheet.feats[feat].description || "empty")
        );
        if (charSheet.feats[feat].adjust) {
            var ft = charSheet.feats[feat],
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
    console.log(featAdjustData);

    return featAdjustData;
}

function getClassAbilities($class) {
    var classAbilities = [];
    for (var myClasses in $class) {
        var charClass = $class[myClasses].charClass;
        for (var ability in charClass.abilities) {
            classAbilities[ability] = charClass.abilities[ability];
        }
    }
    console.log(classAbilities);
    return classAbilities;
}

function abilitiesAndSavingThrows(sheetAbilities, charAbilities, classAbilities, abilitiesData, proficiencyBonus) {
    var skillModifierData = [];

    for (var ability in sheetAbilities) {
        var onSheet = sheetAbilities[ability],
            onChar = charAbilities[ability],
            onClass = classAbilities[ability],
            raceValue = abilitiesData[ability] || 0,
            baseValue = onChar.base_value + raceValue,
            tempModifier = onChar.temp_modifier,
            itemModifier = 0,
            endScore = baseValue + tempModifier + itemModifier,
            modifier = Math.floor((endScore - 10) / 2),
            skilled = onClass ? onClass.saving_throw.skilled : onSheet.saving_throw.skilled,
            isSkilled = skilled ? "Yes" : "No",
            savingThrowModifier = skilled ? proficiencyBonus + modifier : modifier;

        $('#abilities > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name) +
            tableCell(baseValue) +
            tableCell(tempModifier, true) +
            tableCell(itemModifier, true) +
            tableCell(endScore) +
            tableCell((modifier == 0 ? modifier : '+' + modifier)) + '</tr>');

        $('#savingThrows > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name) +
            tableCell(isSkilled) +
            tableCell((savingThrowModifier == 0 ? savingThrowModifier : '+' + savingThrowModifier)) + '</tr>');

        skillModifierData[ability] = modifier;
    }
    console.log(skillModifierData);

    return skillModifierData;
}

function skills(sheetSkills, skillsData, skillModifierData, sheetAbilities, proficiencyBonus) {

    for (var skill in sheetSkills) {
        var onSheet = sheetSkills[skill],
            keyAbility = onSheet.key_ability,
            modifier = skillModifierData[keyAbility],
            skilled = !!skillsData[skill],
            isSkilled = skilled ? "Yes" : "No",
            bonus = skilled ? proficiencyBonus + modifier : modifier;

        $('#skills > .table-responsive table.table tbody').append(
            '<tr>' + tableCell(onSheet.name) +
            tableCell(sheetAbilities[keyAbility].name) +
            tableCell(isSkilled) +
            tableCell((bonus == 0 ? bonus : '+' + bonus)) + '</tr>');
    }
}

function getAlignment(charSheet, lawChaos, goodEvil) {
    return lawChaos == "neutral" && goodEvil == "neutral" ? "True Neutral" : charSheet.alignment.law_chaos[lawChaos].name + ' ' + charSheet.alignment.good_evil[goodEvil].name;
}


function characterInfo(myChar, charSheet, charRace, charBackground, $class, classesList, skillsData, skillModifierData, featAdjustData, featureAdjustData, proficiencyBonus) {
    // CHARACTER INFO
    var cName = myChar.name,
        cRace = charRace.name,
        cBackground = charBackground.name,
        cClass = $class["monk"].name,
        alignment = getAlignment(charSheet, myChar.alignment.law_chaos, myChar.alignment.good_evil),
        level = 0;

    for (var mClass in classesList) { level += classesList[mClass]; }

    $('#characterName').append('<p>Name: </p><h1>' + cName + '</h1>');

    $('#characterInfo .panel-body').append(
        '<p>' + label('Race: ', cRace) + '<br />' +
        label('Background: ', cBackground) + '<br />' +
        label('Class: ', cClass) + '<br />' +
        label('Level: ', level) + '<br />' +
        label('Alignment: ', alignment) + '</p>');

    // OTHER STATS			
    var passiveWisdom = 10 + (skillModifierData["wisdom"]) + (skillsData["perception"] ? proficiencyBonus : 0),
        passiveWisdomName = "Passive wisdom",
        passiveIntelligence = 10 + (skillModifierData["intelligence"]) + (skillsData["investigation"] ? proficiencyBonus : 0),
        passiveIntelligenceName = "Passive Intelligence",
        speedTotal = charRace.base_speed + (featureAdjustData["speed"] || 0) + (featAdjustData["speed"] || 0),
        speed = speedTotal + ' feet',
        speedName = "Speed",
        dex = skillModifierData["dexterity"],
        initiative = dex == 0 ? dex : '+' + dex,
        initiativeName = "Initiative",
        profBonus = '+' + proficiencyBonus;

    $('#stats .list-group').append(
        listWithBadge(profBonus, charSheet.proficiency_bonus.name) +
        listWithBadge(initiative, initiativeName) +
        listWithBadge(speed, speedName) +
        listWithBadge(passiveWisdom, passiveWisdomName) +
        listWithBadge(passiveIntelligence, passiveIntelligenceName)
    );
    $('#level .list-group').append(
        listWithBadge(myChar.experience, 'Experience Points') +
        listWithBadge(level, 'Level')
        // TODO: Make levels for each type of class (multiclasses)
    );
    for (var mClass in classesList) {
        $('#level .list-group').append(
            listWithBadge(classesList[mClass], $class[mClass].charClass.name + ' levels')
        );
    }
}
