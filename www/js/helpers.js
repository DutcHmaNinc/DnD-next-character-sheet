// BUILDERS
//
// ------------------- //

function tableCell(value, hidden) {
    if (hidden) {
        return '<td class="' + hidden + '"><span>' + value + '</span></td>'
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
    return '<a href="javascript:void(0)" class="list-group-item" data-description="' + description + '" data-name="' + name + '"><i class="fa fa-info-circle pull-right"></i>' + name + '</a>';
}

function buildFeaturesList(name, $class) {
    $('#buildFeatures').append(
        '<section id="features-' + name + '" class="panel panel-default"><header class="panel-heading"><h2 class="panel-title">Features ' + $class[name].name + '</h2></header><div class="list-group"></div></section>'
    );
}

// MODAL
//
// ------------------- //

function showModal($object) {
    $object.on('click', function () {
        var clicked = $(this);
        $('#descriptionModal .modal-header h4').html(clicked.data('name'));
        $('#descriptionModal .modal-body').html(clicked.data('description'));
        $('#descriptionModal').modal();
    });
}

// GET FUNCTIONS
//
// ------------------- //

function loadClasses(classesList) {
    var $class = {};
    for (var myClasses in classesList) {
        $.ajax({
            type: 'GET',
            url: 'json/classes/' + myClasses + '.json',
            dataType: 'json',
            success: function (data) { $class[myClasses] = data.charClass; },
            data: {},
            async: false
        });
    }
    return $class;
}

function calculateLevel(xpList, xp) {
    var level;
    for (var i = 0; i < xpList.length ; i++) {
        if (xpList[i] > xp) break;
        level = i + 1;
    }
    return level;
}

function getLevelperClass(myChar, level) {
    var classesList = [];
    for (var i = 0; i < level ; i++) {
        classesList[myChar.level_progression[i].char_class.type] ? classesList[myChar.level_progression[i].char_class.type] += 1 : classesList[myChar.level_progression[i].char_class.type] = 1
    }
    return classesList;
}

function getFeaturesBasedOnClassLevel(charClass, level) {
    var classFeatures = charClass.features,
        featuresData = [];
    for (var feature in classFeatures) {
        classFeatures[feature].level <= level ? featuresData[feature] = true : "";
    }
    return featuresData;
}

function getProficiencyBonus(sheetPB, level) {
    var lvlProgPB = sheetPB.level_progression,
		valuePB = sheetPB.value,
        proficiencyBonus;
    for (var i = 0; i < lvlProgPB.length ; i++) {
        if (lvlProgPB[i] > level) break;
        proficiencyBonus = valuePB[i];
    }
    return proficiencyBonus;
}

function getClassAbilities($class) {
    var classAbilities = [];
    for (var myClasses in $class) {
        var charClass = $class[myClasses];
        for (var ability in charClass.abilities) {
            classAbilities[ability] = charClass.abilities[ability];
        }
    }
    return classAbilities;
}

function getAlignment(charSheet, lawChaos, goodEvil) {
    return lawChaos == "neutral" && goodEvil == "neutral" ? "True Neutral" : charSheet.alignment.law_chaos[lawChaos].name + ' ' + charSheet.alignment.good_evil[goodEvil].name;
}

// OTHER
//
// ------------------- //

function returnDataAndCharacter(character, dataSet) {
    var data = ['character', 'dataSet'];
    data.character = character;
    data.dataSet = dataSet;
    return data;
}

function classesNamed(classesList, $class) {
    var classesName = "", i = 0;
    for (var classes in classesList) {
        i == 0 ? classesName += $class[classes].name : classesName += (' / ' + $class[classes].name);
        i += 1
    }
    return classesName
}

function fillAbilities(charSheet) {
    var abilities = []
    for (var ability in charSheet.abilities) {
        abilities[ability] = 0;
    }
    return abilities
}