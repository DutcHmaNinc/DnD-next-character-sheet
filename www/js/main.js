var $sheet, $char, $class, $classJson, $classFile, $race, $raceJson, $raceFile, $background, $backgroundJson, $backgroundFile;

// LOAD SHEET AND CHARACTER
$.when(
    $.getJSON("json/sheet.json", function (data) { $sheet = data; }),
    $.getJSON("json/characters/calan.json", function (data) { $char = data; })
).then(function () {

    // DESIDE ON WHICH CLASS, RACE, AND BACKGROUND TO LOAD FROM CHARACTER JSON
    $classJson = $char.character.level_progression[0].char_class.type;
    $classFile = 'json/classes/' + $classJson + '.json';
    $raceJson = $char.character.race.type;
    $raceFile = 'json/races/' + $raceJson + '.json';
    $backgroundJson = $char.character.background.type;
    $backgroundFile = 'json/backgrounds/' + $backgroundJson + '.json';

    // LOAD THE FILES
    $.when(
		$.getJSON($classFile, function (data) { $class = data; }),
		$.getJSON($raceFile, function (data) { $race = data; }),
		$.getJSON($backgroundFile, function (data) { $background = data; })
	).then(function () {

	    // LOG ALL DATA 
	    $sheet ? console.log("Sheet successfully loaded") : console.log("Error in sheet");
	    $char ? console.log("Character successfully loaded") : console.log("Error in character");
	    $class ? console.log("Class successfully loaded") : console.log("Error in class");
	    $race ? console.log("Race successfully loaded") : console.log("Error in race");
	    $background ? console.log("Background successfully loaded") : console.log("Error in background");

	    // TODO: LOAD JSON FILES FOR ALL CLASSES ON CHARACTER (MULTICLASS)


	    // START BUILDING SHEET IF ALL FILES ARE LOADED
	    if ($sheet && $char && $class && $race && $background) {

	        // LESS TYPING VAR'S
	        var myChar = $char.character,
				charClass = $class.charClass,
				charSheet = $sheet.sheet,
				charRace = $race.charRace,
				charBackground = $background.charBackground,
				// DATA STORAGE
				skillsData = [],
	            skillModifierData = [],
                abilitiesData = [],
                featuresData = [],
                featureAdjustData = [],
                featsData = [],
                featAdjustData = [];


	        // GET TOTAL LEVEL 
	        var xp = myChar.experience,
				xpList = charSheet.level,
				level;

	        for (var i = 0; i < xpList.length ; i++) {
	            if (xpList[i] > xp) break;
	            level = i + 1;
	        }
	        console.log("Level: " + level);

	        // TODO: Get level per class for multiclass characters

	        // FEATURES	
	        var classFeatures = charClass.features;
	        for (var feature in classFeatures) {
	            classFeatures[feature].level <= level ? featuresData[feature] = true : "";
	        }
	        console.log(featuresData);

	        // ACTIVE FEATURES
	        for (var feature in featuresData) {
	            $('#features .list-group').append(
					listNoBadge(classFeatures[feature].name)
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
	        console.log(featureAdjustData);

	        // GET PROFICIENCY BONUS
	        var sheetPB = charSheet.proficiency_bonus,
				lvlProgPB = sheetPB.level_progression,
				valuePB = sheetPB.value,
				proficiencyBonus;

	        for (var i = 0; i < lvlProgPB.length ; i++) {
	            if (lvlProgPB[i] > level) break;
	            proficiencyBonus = valuePB[i];
	        }
	        console.log("Proficiency Bonus: " + proficiencyBonus);

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

	        // FEATS
	        for (var feat in featsData) {
	            $('#feats .list-group').append(
					listNoBadge(charSheet.feats[feat].name)
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
	        console.log(featAdjustData);

	        // ABILITIES AND SAVING THROWS
	        var sheetAbilities = charSheet.abilities,
				charAbilities = myChar.abilities,
				classAbilities = charClass.abilities;

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

	        // SKILLS

	        var sheetSkills = charSheet.skills;

	        for (var skill in sheetSkills) {
	            var onSheet = sheetSkills[skill],
					keyAbility = onSheet.key_ability,
					modifier = skillModifierData[keyAbility],
					skilled = !!skillsData[skill],
					isSkilled = skilled ? "Yes" : "No",
					bonus = skilled ? proficiencyBonus + modifier : modifier;

	            var rows =

				$('#skills > .table-responsive table.table tbody').append(
					'<tr>' + tableCell(onSheet.name) +
					tableCell(sheetAbilities[keyAbility].name) +
					tableCell(isSkilled) +
					tableCell((bonus == 0 ? bonus : '+' + bonus)) + '</tr>');
	        }

	        // ALIGNMENT

	        var lawChaos = myChar.alignment.law_chaos,
				goodEvil = myChar.alignment.good_evil,
    	        alignment = lawChaos == "neutral" && goodEvil == "neutral" ? "True Neutral" : charSheet.alignment.law_chaos[lawChaos].name + ' ' + charSheet.alignment.good_evil[goodEvil].name;

	        // CHARACTER INFO
	        var cName = myChar.name,
				cRace = charRace.name,
				cBackground = charBackground.name,
				cClass = charClass.name;

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